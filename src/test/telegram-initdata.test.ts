import { describe, it, expect } from "vitest";
import { verifyInitData, signInitData } from "@/server/telegram.server";

const BOT_TOKEN = "123456:TEST_BOT_TOKEN_abcdef";

function makeUser(id = 42) {
  return JSON.stringify({ id, first_name: "Ann", username: "ann", language_code: "ru" });
}

describe("verifyInitData", () => {
  it("accepts a correctly signed, fresh payload", () => {
    const now = 1_700_000_000;
    const initData = signInitData(
      { query_id: "AAE", user: makeUser(), auth_date: String(now) },
      BOT_TOKEN,
    );
    const res = verifyInitData(initData, BOT_TOKEN, { now });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.user.id).toBe(42);
      expect(res.user.username).toBe("ann");
      expect(res.authDate).toBe(now);
      expect(res.hash).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("rejects a tampered field", () => {
    const now = 1_700_000_000;
    const initData = signInitData(
      { user: makeUser(), auth_date: String(now) },
      BOT_TOKEN,
    );
    const tampered = initData.replace(/auth_date=\d+/, `auth_date=${now + 1}`);
    const res = verifyInitData(tampered, BOT_TOKEN, { now });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("bad signature");
  });

  it("rejects a wrong bot token", () => {
    const now = 1_700_000_000;
    const initData = signInitData({ user: makeUser(), auth_date: String(now) }, BOT_TOKEN);
    const res = verifyInitData(initData, "999:OTHER", { now });
    expect(res.ok).toBe(false);
  });

  it("rejects an expired auth_date", () => {
    const authDate = 1_700_000_000;
    const initData = signInitData({ user: makeUser(), auth_date: String(authDate) }, BOT_TOKEN);
    const res = verifyInitData(initData, BOT_TOKEN, { now: authDate + 25 * 3600 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("expired auth_date");
  });

  it("rejects missing hash", () => {
    const res = verifyInitData("user=%7B%7D&auth_date=1", BOT_TOKEN);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("missing hash");
  });

  it("rejects empty initData", () => {
    const res = verifyInitData("", BOT_TOKEN);
    expect(res.ok).toBe(false);
  });
});
