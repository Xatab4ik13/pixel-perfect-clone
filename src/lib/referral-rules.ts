export const REFERRAL_DAYS = 30;

export function nextRewardMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}

export function rewardDays(friendCount: number) {
  return Math.max(0, Math.floor(friendCount)) * REFERRAL_DAYS;
}

/** Referral codes are lowercase hex (from the user row). Keep validation strict. */
const CODE_RE = /^[a-z0-9]{4,32}$/;

/** Build the Mini App deep link that carries a referral code via start_param. */
export function buildInviteLink(botUsername: string | null | undefined, code: string): string {
  const bot = (botUsername ?? "").replace(/^@/, "") || "t_lazeyka_bot";
  return `https://t.me/${bot}?startapp=ref_${code}`;
}

/** Extract the referral code from a Telegram start_param (e.g. "ref_ab12cd34"). */
export function parseRefParam(startParam: string | null | undefined): string | null {
  if (!startParam) return null;
  const m = /^ref_([a-z0-9]{4,32})$/i.exec(startParam.trim());
  if (!m) return null;
  const matched = m[1];
  if (!matched) return null;
  const code = matched.toLowerCase();
  return CODE_RE.test(code) ? code : null;
}
