// Builds MTProto FakeTLS ee-links from a per-user key.
//
//   secret = "ee" + <16-byte key as 32 hex> + hex(SNI domain)
//   link   = tg://proxy?server=<host>&port=<port>&secret=<secret>
//
// The SNI must match the telemt node's configured FakeTLS mask domain (a single
// shared, PQ-validated domain for now, e.g. docs.rs). Links are secret-bearing:
// never log them, only return to their owner.
import { createHash } from "node:crypto";

export interface BuiltLink {
  secret: string;
  tg: string;
  tme: string;
  fingerprint: string;
}

const HEX32 = /^[0-9a-fA-F]{32}$/;

export function buildProxyLink(opts: {
  host: string;
  port: number;
  key: string; // 32 hex chars (16 bytes)
  sni: string;
}): BuiltLink {
  const { host, port, key, sni } = opts;
  if (!HEX32.test(key)) {
    throw new Error("key must be exactly 32 hex characters (16 bytes)");
  }
  if (!host) throw new Error("host required");
  if (!sni) throw new Error("sni required");

  const sniHex = Buffer.from(sni, "utf8").toString("hex");
  const secret = `ee${key.toLowerCase()}${sniHex}`;
  const qs = `server=${encodeURIComponent(host)}&port=${port}&secret=${secret}`;
  return {
    secret,
    tg: `tg://proxy?${qs}`,
    tme: `https://t.me/proxy?${qs}`,
    fingerprint: keyFingerprint(key),
  };
}

/** Short, non-reversible identifier for a key, safe to log/show in admin. */
export function keyFingerprint(key: string): string {
  return createHash("sha256").update(key.toLowerCase()).digest("hex").slice(0, 16);
}
