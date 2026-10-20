// Pure rules for mask domains (no I/O, unit-tested).
// Everyone gets the primary domain; other domains are reserves that staff
// check and switch to manually in the admin panel.

export interface DomainRef {
  domain: string;
  isPrimary: boolean;
}

const DOMAIN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** Lowercase, strip scheme/path; returns null if not a valid hostname. */
export function normalizeDomain(input: string): string | null {
  const d = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/[/:].*$/, "");
  return DOMAIN_RE.test(d) ? d : null;
}

/** The domain every link uses: the row marked primary, else the server default. */
export function primaryDomain(rows: DomainRef[], fallback: string): string {
  return rows.find((r) => r.isPrimary)?.domain ?? fallback;
}
