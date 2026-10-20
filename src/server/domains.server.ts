// Mask-domain pool (server-only): assignment, health checks, auto-disable and
// link reissue. One telemt node serves all domains via censorship.tls_domains;
// the user key stays the same, only the SNI part of the link changes.
import dns from "node:dns/promises";
import tls from "node:tls";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "./db.server";
import { maskDomains, subscriptions, users, type MaskDomain } from "./schema";
import { buildProxyLink } from "./link";
import { env } from "./env.server";
import { telemt } from "./telemt.server";
import { sendTelegramMessage } from "./telegram-notify.server";
import { chooseDomain, normalizeDomain, shouldDisable, type DomainCandidate } from "@/lib/mask-domains";
import { computeAccess } from "@/lib/subscription";

const CHECK_TIMEOUT_MS = 6000;
const MONITOR_INTERVAL_MS = 15 * 60 * 1000;

async function candidates(): Promise<DomainCandidate[]> {
  const db = getDb();
  const rows = await db.select().from(maskDomains);
  const counts = await db
    .select({ d: subscriptions.sniDomain, n: sql<number>`count(*)::int` })
    .from(subscriptions)
    .where(isNotNull(subscriptions.sniDomain))
    .groupBy(subscriptions.sniDomain);
  const byDomain = new Map(counts.map((c) => [c.d, Number(c.n)]));
  return rows.map((r) => ({ domain: r.domain, status: r.status, lastOk: r.lastOk, assigned: byDomain.get(r.domain) ?? 0 }));
}

/** Domain for a link: keep the user's current one if still active, else pick a new one. */
export async function resolveSniFor(current: string | null): Promise<string> {
  ensureDomainMonitor();
  const list = await candidates();
  if (current) {
    const cur = list.find((c) => c.domain === current);
    if (cur && cur.status === "active") return current;
    if (!cur && current === env.proxySni()) {
      // Legacy/default domain: keep it unless the pool has something usable.
      return chooseDomain(list) ?? current;
    }
  }
  return chooseDomain(list, current) ?? env.proxySni();
}

export interface DomainRow extends MaskDomain {
  assigned: number;
}

export async function listDomains(): Promise<DomainRow[]> {
  ensureDomainMonitor();
  const db = getDb();
  const rows = await db.select().from(maskDomains).orderBy(maskDomains.createdAt);
  const list = await candidates();
  return rows.map((r) => ({ ...r, assigned: list.find((c) => c.domain === r.domain)?.assigned ?? 0 }));
}

/** Push the domain list to telemt (censorship.tls_domains). May require a telemt restart. */
export async function syncTelemtDomains(): Promise<{ restartRequired: boolean }> {
  if (env.telemtStub()) return { restartRequired: false };
  const db = getDb();
  const rows = await db.select({ domain: maskDomains.domain }).from(maskDomains);
  return telemt.setTlsDomains(rows.map((r) => r.domain));
}

export async function addDomain(input: string): Promise<{ domain: string; restartRequired: boolean }> {
  const domain = normalizeDomain(input);
  if (!domain) throw new DomainError("Некорректный домен");
  const check = await checkDomain(domain);
  if (!check.ok) throw new DomainError(`Домен не прошёл проверку: ${check.error}`);
  const db = getDb();
  await db
    .insert(maskDomains)
    .values({ domain, status: "active", lastOk: true, lastCheckAt: new Date(), failCount: 0 })
    .onConflictDoNothing();
  const { restartRequired } = await syncTelemtDomains();
  return { domain, restartRequired };
}

export async function setDomainStatus(id: string, status: "active" | "disabled"): Promise<void> {
  const db = getDb();
  const rows = await db.update(maskDomains).set({ status }).where(eq(maskDomains.id, id)).returning();
  const d = rows[0];
  if (!d) throw new DomainError("Домен не найден");
  if (status === "disabled") await reissueUsersOf(d.domain);
}

export class DomainError extends Error {}

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

/** Check one stored domain, record the result, auto-disable after repeated failures. */
export async function checkStoredDomain(id: string): Promise<{ ok: boolean; error?: string; disabled: boolean }> {
  const db = getDb();
  const row = (await db.select().from(maskDomains).where(eq(maskDomains.id, id)).limit(1))[0];
  if (!row) throw new DomainError("Домен не найден");
  const r = await checkDomain(row.domain);
  const failCount = r.ok ? 0 : row.failCount + 1;
  await db
    .update(maskDomains)
    .set({ lastOk: r.ok, lastError: r.ok ? null : (r.error ?? "ошибка"), lastCheckAt: new Date(), failCount })
    .where(eq(maskDomains.id, id));

  let disabled = false;
  if (!r.ok && row.status === "active") {
    const others = (await candidates()).filter((c) => c.domain !== row.domain && c.status === "active" && c.lastOk !== false);
    if (shouldDisable(failCount, others.length)) {
      await setDomainStatus(id, "disabled");
      disabled = true;
      console.warn(`[domains] ${row.domain} disabled after ${failCount} failed checks`);
    }
  }
  return { ...r, disabled };
}

export async function checkAllDomains(): Promise<void> {
  const db = getDb();
  const rows = await db.select({ id: maskDomains.id }).from(maskDomains).where(eq(maskDomains.status, "active"));
  for (const r of rows) {
    try {
      await checkStoredDomain(r.id);
    } catch (e) {
      console.error("[domains] check failed", e instanceof Error ? e.message : e);
    }
  }
}

/** Give every user pinned to `domain` a new link with another domain (same key). */
async function reissueUsersOf(domain: string): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({ userId: subscriptions.userId, link: subscriptions.link, end: subscriptions.currentPeriodEnd, tg: users.telegramUserId })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId))
    .where(and(eq(subscriptions.sniDomain, domain), isNotNull(subscriptions.link)));

  for (const r of rows) {
    const key = /[?&]secret=ee([0-9a-fA-F]{32})/.exec(r.link ?? "")?.[1];
    if (!key) continue;
    const sni = await resolveSniFor(null);
    if (sni === domain) continue;
    const link = buildProxyLink({ host: env.proxyServerHost(), port: env.proxyServerPort(), key, sni });
    await db
      .update(subscriptions)
      .set({ link: link.tg, secretFingerprint: link.fingerprint, sniDomain: sni, updatedAt: sql`now()` })
      .where(eq(subscriptions.userId, r.userId));
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
}

/** Start the periodic check once per process (long-lived node server on the VPS). */
export function ensureDomainMonitor(): void {
  const g = globalThis as { __maskDomainMonitor?: boolean };
  if (g.__maskDomainMonitor || process.env["NODE_ENV"] !== "production") return;
  g.__maskDomainMonitor = true;
  const t = setInterval(() => void checkAllDomains(), MONITOR_INTERVAL_MS);
  t.unref?.();
}
