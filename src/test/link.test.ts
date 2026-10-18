import { describe, it, expect } from "vitest";
import { buildProxyLink, keyFingerprint } from "@/server/link";

describe("buildProxyLink", () => {
  it("builds an ee-link with the SNI hex-encoded", () => {
    const key = "edd8f78e1c0c800fa950460e35c93a6b"; // 32 hex
    const link = buildProxyLink({ host: "72.56.76.88", port: 443, key, sni: "docs.rs" });
    // "docs.rs" => 646f63732e7273
    expect(link.secret).toBe("ee" + key + "646f63732e7273");
    expect(link.tg).toBe(
      `tg://proxy?server=72.56.76.88&port=443&secret=${link.secret}`,
    );
    expect(link.tme).toContain("https://t.me/proxy?");
    expect(link.fingerprint).toMatch(/^[0-9a-f]{16}$/);
  });

  it("rejects a non-hex / wrong-length key", () => {
    expect(() => buildProxyLink({ host: "h", port: 443, key: "xyz", sni: "docs.rs" })).toThrow();
    expect(() =>
      buildProxyLink({ host: "h", port: 443, key: "edd8f78e1c0c800fa950460e35c93a", sni: "docs.rs" }),
    ).toThrow();
  });

  it("fingerprint is stable and case-insensitive", () => {
    const a = keyFingerprint("ABCDEF0123456789ABCDEF0123456789");
    const b = keyFingerprint("abcdef0123456789abcdef0123456789");
    expect(a).toBe(b);
  });
});
