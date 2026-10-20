// Pure rules for the mask-domain pool (no I/O, unit-tested).

/** Consecutive failed checks after which a domain is disabled automatically. */
export const DISABLE_AFTER_FAILS = 3;

export interface DomainCandidate {
  domain: string;
  status: string; // active | disabled
  lastOk: boolean | null;
  assigned: number; // subscriptions currently pinned to it
}

const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Lowercase, strip scheme/path; returns null if not a valid hostname. */
export function normalizeDomain(input: string): string | null {
  const d = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/:].*$/, "");
  return DOMAIN_RE.test(d) ? d : null;
}

/**
 * Pick the domain for a new link: active, not known-failing, least loaded.
 * Returns null when the pool has nothing usable (caller falls back to default).
 */
export function chooseDomain(candidates: DomainCandidate[], exclude?: string | null): string | null {
  const usable = candidates.filter((c) => c.status === "active" && c.lastOk !== false && c.domain !== exclude);
  if (usable.length === 0) return null;
  usable.sort((a, b) => a.assigned - b.assigned || a.domain.localeCompare(b.domain));
  return usable[0]!.domain;
}

/** Should a failing domain be disabled now? Never disable the last usable one. */
export function shouldDisable(failCount: number, otherUsableCount: number): boolean {
  return failCount >= DISABLE_AFTER_FAILS && otherUsableCount > 0;
}
