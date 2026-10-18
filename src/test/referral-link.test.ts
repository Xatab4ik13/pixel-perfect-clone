import { describe, it, expect } from "vitest";
import { buildInviteLink, parseRefParam } from "@/lib/referral-rules";

describe("referral deep links", () => {
  it("builds a startapp deep link from a code", () => {
    expect(buildInviteLink("t_lazeyka_bot", "ab12cd34")).toBe(
      "https://t.me/t_lazeyka_bot?startapp=ref_ab12cd34",
    );
  });

  it("strips a leading @ from the bot username", () => {
    expect(buildInviteLink("@t_lazeyka_bot", "deadbeef")).toBe(
      "https://t.me/t_lazeyka_bot?startapp=ref_deadbeef",
    );
  });

  it("parses a valid ref start_param (case-insensitive)", () => {
    expect(parseRefParam("ref_AB12cd34")).toBe("ab12cd34");
  });

  it("rejects non-referral or malformed params", () => {
    expect(parseRefParam(null)).toBeNull();
    expect(parseRefParam("")).toBeNull();
    expect(parseRefParam("hello")).toBeNull();
    expect(parseRefParam("ref_")).toBeNull();
    expect(parseRefParam("ref_!!!")).toBeNull();
  });

  it("round-trips build -> parse", () => {
    const link = buildInviteLink("t_lazeyka_bot", "0f9e8d7c");
    const param = new URL(link).searchParams.get("startapp");
    expect(parseRefParam(param)).toBe("0f9e8d7c");
  });
});
