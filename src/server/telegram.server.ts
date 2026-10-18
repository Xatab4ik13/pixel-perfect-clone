// Telegram Mini App initData verification (server-only).
//
// Flow per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//   data_check_string = join("\n", sort(["key=value" for all fields except `hash`]))
//   secret_key        = HMAC_SHA256(key="WebAppData", message=bot_token)
//   expected_hash     = hex(HMAC_SHA256(key=secret_key, message=data_check_string))
//   valid  <=>  expected_hash == provided hash  (constant-time)
//
// We additionally enforce auth_date freshness. Anti-replay (dedupe by hash) is
// left to the caller, which has access to a store; we expose `hash` for that.
import { createHmac, timingSafeEqual } from "node:crypto";

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export type VerifyResult =
  | { ok: true; user: TelegramUser; authDate: number; hash: string; raw: Record<string, string> }
  | { ok: false; error: string };

const DEFAULT_MAX_AGE_SEC = 24 * 60 * 60; // 24h, per Telegram guidance

export function verifyInitData(
  initData: string,
  botToken: string,
  opts: { maxAgeSec?: number; now?: number } = {},
): VerifyResult {
  if (!initData) return { ok: false, error: "empty initData" };
  if (!botToken) return { ok: false, error: "missing bot token" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, error: "missing hash" };

  // Build data_check_string from every field except `hash`, sorted by key.
  const entries: Array<[string, string]> = [];
  const raw: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    raw[key] = value;
    if (key === "hash") continue;
    entries.push([key, value]);
  }
  entries.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expected = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!constantTimeEqualHex(expected, hash)) {
    return { ok: false, error: "bad signature" };
  }

  // Freshness check.
  const authDateStr = params.get("auth_date");
  const authDate = authDateStr ? Number(authDateStr) : NaN;
  if (!Number.isFinite(authDate)) return { ok: false, error: "missing auth_date" };
  const now = opts.now ?? Math.floor(Date.now() / 1000);
  const maxAge = opts.maxAgeSec ?? DEFAULT_MAX_AGE_SEC;
  if (now - authDate > maxAge) return { ok: false, error: "expired auth_date" };
  // Reject clearly future-dated payloads (allow small clock skew).
  if (authDate - now > 300) return { ok: false, error: "future auth_date" };

  const userStr = params.get("user");
  if (!userStr) return { ok: false, error: "missing user" };
  let user: TelegramUser;
  try {
    user = JSON.parse(userStr) as TelegramUser;
  } catch {
    return { ok: false, error: "bad user json" };
  }
  if (typeof user.id !== "number" || !Number.isFinite(user.id)) {
    return { ok: false, error: "bad user id" };
  }

  return { ok: true, user, authDate, hash, raw };
}

function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/** Test/helper: produce a valid initData string signed with the given bot token. */
export function signInitData(
  fields: Record<string, string>,
  botToken: string,
): string {
  const entries = Object.entries(fields).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const params = new URLSearchParams(fields);
  params.set("hash", hash);
  return params.toString();
}
