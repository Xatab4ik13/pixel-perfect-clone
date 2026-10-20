import { describe, it, expect } from "vitest";
import { dueReminder } from "@/lib/reminders";

const now = new Date("2026-10-20T12:00:00Z");
const h = (n: number) => new Date(now.getTime() + n * 3600_000);
const none = { r3: null, r0: null };

describe("expiry reminders", () => {
  it("reminds 3 days before the end", () => {
    expect(dueReminder(h(70), now, none)).toBe("3d");
  });
  it("reminds on the last day", () => {
    expect(dueReminder(h(10), now, none)).toBe("0d");
  });
  it("does not remind with more than 3 days left or after the end", () => {
    expect(dueReminder(h(80), now, none)).toBeNull();
    expect(dueReminder(h(-1), now, none)).toBeNull();
  });
  it("never sends the same reminder twice for the same period", () => {
    const end = h(70);
    expect(dueReminder(end, now, { r3: end, r0: null })).toBeNull();
  });
  it("re-arms after renewal (new period end)", () => {
    expect(dueReminder(h(70), now, { r3: h(10), r0: null })).toBe("3d");
  });
});
