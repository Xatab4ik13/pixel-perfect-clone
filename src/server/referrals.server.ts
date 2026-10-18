// Referral program service (server-only): attribution + reward lifecycle.
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db.server";
import { users, payments, referrals } from "./schema";
import { env } from "./env.server";
import { parseRefParam } from "@/lib/referral-rules";

export interface ReferralStats {
  code: string;
  invited: number;
  rewarded: number;
  rewardDays: number;
  perFriendDays: number;
}

/**
 * Attribute a (usually new) user to a referrer based on the Mini App start_param
 * (e.g. "ref_ab12cd34"). Best-effort and idempotent:
 *  - a friend can only be attributed once (referred_user_id is UNIQUE),
 *  - never self-referral,
 *  - only before the friend has paid anything (prevents stealing existing customers).
 */
export async function attributeReferral(referredUserId: string, startParam: string | null | undefined): Promise<void> {
  const code = parseRefParam(startParam);
  if (!code) return;
  try {
    const db = getDb();

    // Already attributed? Then we're done.
    const existing = await db
      .select({ id: referrals.id })
      .from(referrals)
      .where(eq(referrals.referredUserId, referredUserId))
      .limit(1);
    if (existing[0]) return;

    // Don't attribute users who have already paid.
    const paid = await db
      .select({ id: payments.id })
      .from(payments)
      .where(and(eq(payments.userId, referredUserId), eq(payments.status, "paid")))
      .limit(1);
    if (paid[0]) return;

    // Resolve the referrer by code.
    const ref = await db.select({ id: users.id }).from(users).where(eq(users.referralCode, code)).limit(1);
    const referrerUserId = ref[0]?.id;
    if (!referrerUserId || referrerUserId === referredUserId) return;

    await db
      .insert(referrals)
      .values({ referrerUserId, referredUserId, status: "pending", rewardDays: env.referralDays() })
      .onConflictDoNothing();
  } catch (e) {
    // Referral attribution must never block auth.
    console.error("[referral] attribute failed", e instanceof Error ? e.message : e);
  }
}

/** Referral stats for the My Invitations screen. */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const db = getDb();
  const urows = await db.select({ code: users.referralCode }).from(users).where(eq(users.id, userId)).limit(1);
  const code = urows[0]?.code ?? "";

  const agg = await db
    .select({
      invited: sql<number>`count(*)::int`,
      rewarded: sql<number>`count(*) filter (where ${referrals.status} = 'rewarded')::int`,
      rewardDays: sql<number>`coalesce(sum(${referrals.rewardDays}) filter (where ${referrals.status} = 'rewarded'), 0)::int`,
    })
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));

  const row = agg[0];
  return {
    code,
    invited: row?.invited ?? 0,
    rewarded: row?.rewarded ?? 0,
    rewardDays: row?.rewardDays ?? 0,
    perFriendDays: env.referralDays(),
  };
}

/**
 * Atomically claim a pending referral for a friend who just paid. Returns the
 * referrer to reward (and the day count), or null if there is nothing to reward.
 * The UPDATE ... RETURNING guarantees a single claim even under webhook retries.
 */
export async function claimReferralReward(
  referredUserId: string,
): Promise<{ referrerUserId: string; days: number } | null> {
  const db = getDb();
  const days = env.referralDays();
  const claimed = await db
    .update(referrals)
    .set({ status: "rewarded", rewardDays: days, rewardedAt: sql`now()` })
    .where(and(eq(referrals.referredUserId, referredUserId), eq(referrals.status, "pending")))
    .returning({ referrerUserId: referrals.referrerUserId });
  const row = claimed[0];
  return row ? { referrerUserId: row.referrerUserId, days } : null;
}
