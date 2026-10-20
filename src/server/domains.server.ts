// Mask domains (server-only). Every user gets the same primary domain with
// their own key; reserve domains are checked and switched to manually by staff.
// Switching rebuilds every link with the new domain (same key) and DMs users.
// One telemt node serves all domains via censorship.tls_domains.
import dns from "node:dns/promises";
import tls from "node:tls";
import { and, eq, isNotNull, ne, or, isNull, sql } from "drizzle-orm";
import { getDb } from "./db.server";
import { maskDomains, subscriptions, users, type MaskDomain } from "./schema";
import { buildProxyLink } from "./link";
import { env } from "./env.server";
import { telemt } from "./telemt.server";
import { sendTelegramMessage } from "./telegram-notify.server";
import { normalizeDomain, primaryDomain } from "@/lib/mask-domains";
import { computeAccess } from "@/lib/subscription";

const CHECK_TIMEOUT_MS = 6000;
const MONITOR_INTERVAL_MS = 15 * 60 * 1000;

export class DomainError extends Error {}

/** The domain baked into every issued link. */
export async function currentPrimaryDomain(): Promise<string> {
  ensureDomainMonitor();
  const rows = await getDb().select({ domain: maskDomains.domain, isPrimary: maskDomains.isPrimary }).from(maskDomains);
  return primaryDomain(rows, env.proxySni());
}

export interface DomainRow extends MaskDomain {
  assigned: number;
}

export async function listDomains(): Promise<{ domains: DomainRow[]; primary: string }> {
  ensureDomainMonitor();
  const db = getDb();
  const rows = await db.select().from(maskDomains).orderBy(maskDomains.createdAt);
  const counts = await db
    .select({ d: subscriptions.sniDomain, n: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(isNotNull(subscriptions.link))
    .groupBy(subscriptions.sniDomain);
  const by = new Map(counts.map((c) => [c.d, Number(c.n)]));
  return {
    domains: rows.map((r) => ({ ...r, assigned: by.get(r.domain) ?? 0 })),
    primary: primaryDomain(rows, env.proxySni()),
  };
}

/** Push all domains to telemt (censorship.tls_domains). tls_domains needs a telemt restart. */
export async function syncTelemtDomains(): Promise<{ restartRequired: boolean }> {
  if (env.telemtStub()) return { restartRequired: false };
  const rows = await getDb().select({ domain: maskDomains.domain }).from(maskDomains);
  return telemt.setTlsDomains(rows.map((r) => r.domain));
}

/** Add a reserve domain (checked first). It is not used until made primary. */
export async function addDomain(input: string): Promise<{ domain: string; restartRequired: boolean }> {
  const domain = normalizeDomain(input);
  if (!domain) throw new DomainError("Некорректный домен");
  const check = await checkDomain(domain);
  if (!check.ok) throw new DomainError(`Домен не прошёл проверку: ${check.error}`);
  await getDb()
    .insert(maskDomains)
    .values({ domain, lastOk: true, lastCheckAt: new Date(), failCount: 0 })
    .onConflictDoNothing();
  const { restartRequired } = await syncTelemtDomains();
  return { domain, restartRequired };
}

/** Make a reserve the primary domain and reissue every link with it. */
export async function makePrimary(id: string): Promise<{ domain: string; reissued: number }> {
  const db = getDb();
  const row = (await db.select().from(maskDomains).where(eq(maskDomains.id, id)).limit(1))[0];
  if (!row) throw new DomainError("Домен не найден");
  const check = await checkDomain(row.domain);
  if (!check.ok) throw new DomainError(`Домен не прошёл проверку: ${check.error}`);
  await db.transaction(async (tx) => {
    await tx.update(maskDomains).set({ isPrimary: false }).where(eq(maskDomains.isPrimary, true));
    await tx.update(maskDomains).set({ isPrimary: true, lastOk: true, lastCheckAt: new Date(), failCount: 0 }).where(eq(maskDomains.id, id));
  });
  const reissued = await reissueAllTo(row.domain);
  return { domain: row.domain, reissued };
}

/** DNS + real TLS 1.3 handshake with this SNI (FakeTLS mimics TLS 1.3). */
export async function checkDomain(domain: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const addrs = await Promise.race([
      dns.resolve4(domain),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("DNS timeout")), CHECK_TIMEOUT_MS)),
    ]);
    if (!addrs.length) return { ok: false, error: "нет DNS-записи" };
  } catch (e) {
    return { ok: false, error: `DNS: ${e instanceof Error ? e.message : String(e)}` };
  }
  return new Promise((resolve) => {
    const socket = tls.connect({ host: domain, port: 443, servername: domain, minVersion: "TLSv1.3", timeout: CHECK_TIMEOUT_MS });
    const done = (r: { ok: boolean; error?: string }) => {
      socket.destroy();
      resolve(r);
    };
    socket.once("secureConnect", () =>
      done(socket.authorized ? { ok: true } : { ok: false, error: `сертификат: ${String(socket.authorizationError)}` }),
    );
    socket.once("timeout", () => done({ ok: false, error: "TLS timeout" }));
    socket.once("error", (e) => done({ ok: false, error: `TLS: ${e.message}` }));
  });
}

/** Check one stored domain and record the result. Never switches anything by itself. */
export async function checkStoredDomain(id: string): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const row = (await db.select().from(maskDomains).where(eq(maskDomains.id, id)).limit(1))[0];
  if (!row) throw new DomainError("Домен не найден");
  const r = await checkDomain(row.domain);
  await db
    .update(maskDomains)
    .set({ lastOk: r.ok, lastError: r.ok ? null : (r.error ?? "ошибка"), lastCheckAt: new Date(), failCount: r.ok ? 0 : row.failCount + 1 })
    .where(eq(maskDomains.id, id));
  return r;
}

export async function checkAllDomains(): Promise<void> {
  const rows = await getDb().select({ id: maskDomains.id }).from(maskDomains);
  for (const r of rows) {
    try {
      await checkStoredDomain(r.id);
    } catch (e) {
      console.error("[domains] check failed", e instanceof Error ? e.message : e);
    }
  }
}

/** Rebuild every issued link that is not on `domain` (same key) and DM active users. */
async function reissueAllTo(domain: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ userId: subscriptions.userId, link: subscriptions.link, end: subscriptions.currentPeriodEnd, tg: users.telegramUserId })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId))
    .where(and(isNotNull(subscriptions.link), or(isNull(subscriptions.sniDomain), ne(subscriptions.sniDomain, domain))));

  let n = 0;
  for (const r of rows) {
    const key = /[?&]secret=ee([0-9a-fA-F]{32})/.exec(r.link ?? "")?.[1];
    if (!key) continue;
    const link = buildProxyLink({ host: env.proxyServerHost(), port: env.proxyServerPort(), key, sni: domain });
    await db
      .update(subscriptions)
      .set({ link: link.tg, secretFingerprint: link.fingerprint, sniDomain: domain, updatedAt: sql`now()` })
      .where(eq(subscriptions.userId, r.userId));
    n++;
    if (computeAccess(r.end ?? null).status === "active") {
      try {
        await sendTelegramMessage(r.tg, "🔄 Мы обновили вашу ссылку подключения. Нажмите кнопку ниже, чтобы подключиться заново.", {
          replyMarkup: { inline_keyboard: [[{ text: "🔌 Подключить", url: link.tme }]] },
        });
      } catch (e) {
        console.error("[domains] notify failed", r.tg, e instanceof Error ? e.message : e);
      }
    }
  }
  return n;
}

/** Start the periodic check once per process (long-lived node server on the VPS). */
export function ensureDomainMonitor(): void {
  const g = globalThis as { __maskDomainMonitor?: boolean };
  if (g.__maskDomainMonitor || process.env["NODE_ENV"] !== "production") return;
  g.__maskDomainMonitor = true;
  const t = setInterval(() => void checkAllDomains(), MONITOR_INTERVAL_MS);
  t.unref?.();
}
