import { describe, it, expect } from "vitest";
import { extendPeriod, computeAccess } from "@/lib/subscription";

const DAY = 86_400_000;

describe("extendPeriod", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("starts from now when there is no current period", () => {
    const end = extendPeriod(null, 30, now);
    expect(end.getTime()).toBe(now.getTime() + 30 * DAY);
  });

  it("starts from now when the current period is already expired", () => {
    const past = new Date(now.getTime() - 10 * DAY);
    const end = extendPeriod(past, 30, now);
    expect(end.getTime()).toBe(now.getTime() + 30 * DAY);
  });

  it("stacks on top of remaining time when still active", () => {
    const future = new Date(now.getTime() + 5 * DAY);
    const end = extendPeriod(future, 30, now);
    expect(end.getTime()).toBe(future.getTime() + 30 * DAY);
  });
});

describe("computeAccess", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("pending without a period", () => {
    expect(computeAccess(null, now)).toEqual({ status: "pending", daysLeft: 0 });
  });

  it("expired in the past", () => {
    expect(computeAccess(new Date(now.getTime() - 1), now)).toEqual({ status: "expired", daysLeft: 0 });
  });

  it("active with rounded-up days", () => {
    const end = new Date(now.getTime() + 2.5 * DAY);
    expect(computeAccess(end, now)).toEqual({ status: "active", daysLeft: 3 });
  });
});
