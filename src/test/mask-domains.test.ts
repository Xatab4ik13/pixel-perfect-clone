import { describe, it, expect } from "vitest";
import { normalizeDomain, primaryDomain } from "@/lib/mask-domains";

describe("mask domains", () => {
  it("everyone gets the server default while no reserve is made primary", () => {
    expect(primaryDomain([{ domain: "a.ru", isPrimary: false }, { domain: "b.ru", isPrimary: false }], "docs.rs")).toBe("docs.rs");
  });
  it("everyone gets the reserve that staff made primary", () => {
    expect(primaryDomain([{ domain: "a.ru", isPrimary: false }, { domain: "b.ru", isPrimary: true }], "docs.rs")).toBe("b.ru");
  });
  it("normalizes input", () => {
    expect(normalizeDomain("https://Docs.RS/path")).toBe("docs.rs");
    expect(normalizeDomain("not a domain")).toBeNull();
  });
});
