// Access/subscription service (server-only): the bridge between our DB, the
// telemt control-plane, and issued ee-links.
import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db.server";
import { users, subscriptions, payments, type Subscription } from "./schema";
import { telemt, TelemtError, type TelemtUserView } from "./telemt.server";
import { buildProxyLink } from "./link";
import { tryNotifyAccessGranted } from "./telegram-notify.server";
import { claimReferralReward } from "./referrals.server";
import { env } from "./env.server";
import { getPlan, type Plan } from "@/lib/plans";
import { extendPeriod, computeAccess, type AccessStatus } from "@/lib/subscription";

export interface AccessView {
  status: AccessStatus;
  daysLeft: number;
  currentPeriodEnd: string | null;
  planId: string | null;
  hasLink: boolean;
}

function telemtUsernameFor(telegramUserId: number): string {
  return `u${telegramUserId}`;
}

/** Extract the 32-hex key from a stored ee-link (secret = ee + key + hex(sni)). */
function keyFromLink(link: string | null): string | null {
  if (!link) return null;
  const m = /[?&]secret=ee([0-9a-fA-F]{32})/.exec(link);
  return m ? m[1]!.toLowerCase() : null;
}

/**
 * Resolve the 32-hex key from any telemt response shape:
 *  - POST returns { secret, user:{ links.tls } }
 *  - GET  returns { links.tls } (no secret field)
 */
function keyFromTelemtView(v: TelemtUserView | null | undefined): string | null {
  if (!v) return null;
  if (typeof v.secret === "string") {
    const m = /^([0-9a-fA-F]{32})/.exec(v.secret);
    if (m) return m[1]!.toLowerCase();
  }
  const tls = v.links?.tls ?? v.user?.links?.tls;
  if (Array.isArray(tls)) {
    for (const l of tls) {
      const k = keyFromLink(l);
      if (k) return k;
    }
  }
  return null;
}

async function getOrCreateSubscription(userId: string): Promise<Subscription> {
  const db = getDb();
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  if (existing[0]) return existing[0];
  const created = await db
    .insert(subscriptions)
    .values({ userId, status: "pending" })
    .onConflictDoNothing()
    .returning();
  if (created[0]) return created[0];
  // Lost a race; read the row the other writer created.
  const again = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return again[0]!;
}

export async function getAccessView(userId: string): Promise<AccessView> {
  const sub = await getOrCreateSubscription(userId);
  const { status, daysLeft } = computeAccess(sub.currentPeriodEnd ?? null);
  return {
    status,
    daysLeft,
    currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
    planId: sub.planId,
    hasLink: Boolean(sub.link) && status === "active",
  };
}

/** Owner-only: returns the ee-link if access is currently active, else null. */
export async function getActiveLink(userId: string): Promise<string | null> {
  const sub = await getOrCreateSubscription(userId);
  const { status } = computeAccess(sub.currentPeriodEnd ?? null);
  if (status !== "active" || !sub.link) return null;
  return sub.link;
}

/** Provision (create or update) the telemt user and return its 32-hex secret. */
async function provisionTelemt(
  telegramUserId: number,
  maxUniqueIps: number,
  periodEnd: Date,
  existingUsername: string | null,
  existingSecret: string | null,
): Promise<{ username: string; secret: string }> {
  const username = existingUsername ?? telemtUsernameFor(telegramUserId);
  const expirationRfc3339 = periodEnd.toISOString();

  // Stub mode: generate/keep a local key without touching a telemt node.
  if (env.telemtStub()) {
    const secret = existingSecret ?? randomBytes(16).toString("hex");
    return { username, secret };
  }

  // Does the user already exist on the node?
  let current: TelemtUserView | null = null;
  try {
    current = await telemt.getUser(username);
  } catch (e) {
    if (!(e instanceof TelemtError && e.status === 404)) throw e;
  }

  if (current) {
    // Renewal: update expiry/limits, reuse the existing key (stored or from links).
    await telemt.patchUser(username, { expirationRfc3339, maxUniqueIps, enabled: true });
    const secret = existingSecret ?? keyFromTelemtView(current);
    if (!secret) throw new TelemtError(`could not resolve secret for existing user ${username}`);
    return { username, secret };
  }

  const view = await telemt.createUser({ username, expirationRfc3339, maxUniqueIps, enabled: true });
  const secret = keyFromTelemtView(view);
  if (!secret) throw new TelemtError(`telemt did not return a secret for ${username}`);
  return { username, secret };
}

/**
 * Extend access by `days`, provision telemt, and (re)issue the link. Used by
 * both manual admin grants and (indirectly) paid activation. Non-transactional.
 */
export async function activateAccess(
  userId: string,
  days: number,
  opts: { maxUniqueIps?: number; planId?: string } = {},
): Promise<Subscription> {
  const db = getDb();
  const sub = await getOrCreateSubscription(userId);
  const urows = await db.select({ tg: users.telegramUserId }).from(users).where(eq(users.id, userId)).limit(1);
  const telegramUserId = urows[0]?.tg;
  if (telegramUserId == null) throw new Error("user not found");

  const periodEnd = extendPeriod(sub.currentPeriodEnd ?? null, days);
  const maxUniqueIps = opts.maxUniqueIps ?? sub.maxUniqueIps ?? 5;
  const { username, secret } = await provisionTelemt(
    telegramUserId,
    maxUniqueIps,
    periodEnd,
    sub.telemtUsername,
    keyFromLink(sub.link),
  );
  const link = buildProxyLink({
    host: env.proxyServerHost(),
    port: env.proxyServerPort(),
    key: secret,
    sni: env.proxySni(),
  });
  const updated = await db
    .update(subscriptions)
    .set({
      status: "active",
      planId: opts.planId ?? sub.planId ?? "manual",
      currentPeriodEnd: periodEnd,
      telemtUsername: username,
      maxUniqueIps,
      link: link.tg,
      secretFingerprint: link.fingerprint,
      updatedAt: sql`now()`,
    })
    .where(eq(subscriptions.userId, userId))
    .returning();

  const planName = getPlan(opts.planId ?? sub.planId ?? "")?.name ?? null;
  await tryNotifyAccessGranted(telegramUserId, link.tme, periodEnd, planName);
  return updated[0]!;
}

/**
 * Apply a successful payment: idempotently extend the subscription, provision
 * the telemt user, and (re)issue the ee-link. Safe to call from webhook retries.
 */
export async function applyPaidPayment(paymentId: string): Promise<Subscription> {
  const db = getDb();
  let notify: { tg: number; tme: string; periodEnd: Date; planName: string } | null = null;
  let payerUserId: string | null = null;
  const result = await db.transaction(async (tx) => {
    const payRows = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .for("update")
      .limit(1);
    const payment = payRows[0];
    if (!payment) throw new Error(`payment not found: ${paymentId}`);
    payerUserId = payment.userId;

    const subRows = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, payment.userId))
      .for("update")
      .limit(1);
    const sub = subRows[0];
    if (!sub) throw new Error(`subscription missing for user ${payment.userId}`);

    // Idempotency: if we've already applied this payment, return unchanged.
    if (payment.status === "paid") return sub;

    const plan = getPlan(payment.planId);
    if (!plan) throw new Error(`unknown plan on payment: ${payment.planId}`);

    const periodEnd = extendPeriod(sub.currentPeriodEnd ?? null, plan.days);

    // Need the Telegram id to derive the telemt username — read from users join.
    const telegramUserId = await tx
      .execute(sql`select telegram_user_id from public.users where id = ${payment.userId}`)
      .then((r) => Number((r as unknown as Array<{ telegram_user_id: number }>)[0]?.telegram_user_id));
    if (!Number.isFinite(telegramUserId)) throw new Error("user telegram id not found");

    const { username, secret } = await provisionTelemt(
      telegramUserId,
      plan.maxUniqueIps,
      periodEnd,
      sub.telemtUsername,
      keyFromLink(sub.link),
    );

    const link = buildProxyLink({
      host: env.proxyServerHost(),
      port: env.proxyServerPort(),
      key: secret,
      sni: env.proxySni(),
    });

    const updated = await tx
      .update(subscriptions)
      .set({
        status: "active",
        planId: plan.id,
        currentPeriodEnd: periodEnd,
        telemtUsername: username,
        maxUniqueIps: plan.maxUniqueIps,
        link: link.tg,
        secretFingerprint: link.fingerprint,
        updatedAt: sql`now()`,
      })
      .where(eq(subscriptions.userId, payment.userId))
      .returning();

    await tx
      .update(payments)
      .set({ status: "paid", paidAt: sql`now()` })
      .where(eq(payments.id, paymentId));

    notify = { tg: telegramUserId, tme: link.tme, periodEnd, planName: plan.name };
    return updated[0]!;
  });

  // Best-effort DM after the payment is durably committed.
  if (notify) {
    const n = notify as { tg: number; tme: string; periodEnd: Date; planName: string };
    await tryNotifyAccessGranted(n.tg, n.tme, n.periodEnd, n.planName);
  }

  // Referral reward: if this payer was invited, credit the referrer with free
  // days. Atomic claim prevents double rewards; best-effort so it never breaks
  // the payment flow.
  if (payerUserId) {
    try {
      const claim = await claimReferralReward(payerUserId);
      if (claim) {
        // Keep the referrer's existing plan label; just extend their access.
        await activateAccess(claim.referrerUserId, claim.days);
      }
    } catch (e) {
      console.error("[referral] reward failed", e instanceof Error ? e.message : e);
    }
  }
  return result;
}

/** Staff action: suspend or resume access on the telemt node. */
export async function setSuspended(userId: string, suspended: boolean): Promise<void> {
  const db = getDb();
  const sub = await getOrCreateSubscription(userId);
  if (!sub.telemtUsername && !env.telemtStub()) return;
  if (sub.telemtUsername && !env.telemtStub()) {
    await telemt.patchUser(sub.telemtUsername, { enabled: !suspended });
  }
  await db
    .update(subscriptions)
    .set({ status: suspended ? "canceled" : "active", updatedAt: sql`now()` })
    .where(eq(subscriptions.userId, userId));
}

/** Staff action: rotate the user's secret and reissue the link. */
export async function rotateUserSecret(userId: string): Promise<void> {
  const db = getDb();
  const sub = await getOrCreateSubscription(userId);
  const username = sub.telemtUsername;
  if (!username) return;

  let secret: string;
  if (env.telemtStub()) {
    secret = randomBytes(16).toString("hex");
  } else {
    const view = await telemt.rotateSecret(username);
    const resolved = keyFromTelemtView(view);
    if (!resolved) throw new TelemtError(`rotate-secret returned no secret for ${username}`);
    secret = resolved;
  }
  const link = buildProxyLink({
    host: env.proxyServerHost(),
    port: env.proxyServerPort(),
    key: secret,
    sni: env.proxySni(),
  });
  await db
    .update(subscriptions)
    .set({ link: link.tg, secretFingerprint: link.fingerprint, updatedAt: sql`now()` })
    .where(eq(subscriptions.userId, userId));
}
