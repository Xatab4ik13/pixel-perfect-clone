export const REFERRAL_DAYS = 30;
export function nextRewardMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}
export function rewardDays(friendCount: number) {
  return Math.max(0, Math.floor(friendCount)) * REFERRAL_DAYS;
}