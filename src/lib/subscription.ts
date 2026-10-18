// Pure subscription math (no I/O), shared and unit-tested.

export type AccessStatus = "pending" | "active" | "expired";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Extend an access period by `days`. Renewals stack on top of remaining time:
 * if the current period is still in the future we add onto it, otherwise we
 * start from `now`.
 */
export function extendPeriod(current: Date | null, days: number, now: Date = new Date()): Date {
  const base = current && current.getTime() > now.getTime() ? current : now;
  return new Date(base.getTime() + days * DAY_MS);
}

/** Derive a user-facing access status and remaining whole days. */
export function computeAccess(
  periodEnd: Date | null,
  now: Date = new Date(),
): { status: AccessStatus; daysLeft: number } {
  if (!periodEnd) return { status: "pending", daysLeft: 0 };
  const ms = periodEnd.getTime() - now.getTime();
  if (ms <= 0) return { status: "expired", daysLeft: 0 };
  return { status: "active", daysLeft: Math.ceil(ms / DAY_MS) };
}
