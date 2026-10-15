import { describe, expect, it } from "vitest";
import { nextRewardMonth, rewardDays } from "@/lib/referral-rules";

describe("referral rewards", () => {
  it("awards 30 access days for each friend", () => {
    expect(rewardDays(1)).toBe(30);
    expect(rewardDays(3)).toBe(90);
    expect(rewardDays(0)).toBe(0);
  });
  it("makes rewards available next calendar month", () => {
    expect(nextRewardMonth(new Date("2026-10-15T17:23:00Z"))).toBe("2026-11-01");
    expect(nextRewardMonth(new Date("2026-12-31T23:59:59Z"))).toBe("2027-01-01");
  });
});