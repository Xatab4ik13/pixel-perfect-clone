// Pure rule: which expiry reminder (if any) is due for a subscription.
const DAY = 24 * 60 * 60 * 1000;

export type ReminderKind = "3d" | "0d";

export function dueReminder(
  periodEnd: Date | null,
  now: Date,
  sent: { r3: Date | null; r0: Date | null },
): ReminderKind | null {
  if (!periodEnd) return null;
  const left = periodEnd.getTime() - now.getTime();
  if (left <= 0) return null;
  const same = (d: Date | null) => d != null && d.getTime() === periodEnd.getTime();
  if (left <= DAY) return same(sent.r0) ? null : "0d";
  if (left <= 3 * DAY) return same(sent.r3) ? null : "3d";
  return null;
}
