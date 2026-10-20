import { describe, it, expect } from "vitest";
import { chooseDomain, normalizeDomain, shouldDisable } from "@/lib/mask-domains";

const c = (domain: string, assigned: number, status = "active", lastOk: boolean | null = true) => ({ domain, assigned, status, lastOk });

describe("mask domains", () => {
  it("gives a new user the least loaded working domain", () => {
    expect(chooseDomain([c("a.ru", 5), c("b.ru", 2), c("c.ru", 9)])).toBe("b.ru");
  });
  it("never gives a disabled or failing domain", () => {
    expect(chooseDomain([c("a.ru", 0, "disabled"), c("b.ru", 0, "active", false), c("c.ru", 50)])).toBe("c.ru");
  });
  it("skips the domain being replaced", () => {
    expect(chooseDomain([c("a.ru", 0), c("b.ru", 10)], "a.ru")).toBe("b.ru");
  });
  it("returns null when nothing usable", () => {
    expect(chooseDomain([c("a.ru", 0, "disabled")])).toBeNull();
  });
  it("disables after 3 failed checks, but never the last working domain", () => {
    expect(shouldDisable(2, 3)).toBe(false);
    expect(shouldDisable(3, 3)).toBe(true);
    expect(shouldDisable(3, 0)).toBe(false);
  });
  it("normalizes input", () => {
    expect(normalizeDomain("https://Docs.RS/path")).toBe("docs.rs");
    expect(normalizeDomain("not a domain")).toBeNull();
  });
});
