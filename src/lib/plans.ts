// Canonical plan catalog. The SERVER treats this as the source of truth for
// pricing and granted days — never trust an amount sent by the client.
// Shared with the client only for display.

export interface Plan {
  id: "month" | "quarter" | "year";
  name: string;
  /** Price in rubles (display). */
  price: number;
  /** Price in kopecks (charge/authority). */
  priceKopecks: number;
  /** Access days granted on successful payment. */
  days: number;
  /** Anti-sharing: max unique source IPs allowed on the telemt user. */
  maxUniqueIps: number;
}

export const PLANS: readonly Plan[] = [
  { id: "month", name: "1 месяц", price: 199, priceKopecks: 19900, days: 30, maxUniqueIps: 3 },
  { id: "quarter", name: "3 месяца", price: 499, priceKopecks: 49900, days: 90, maxUniqueIps: 4 },
  { id: "year", name: "12 месяцев", price: 1690, priceKopecks: 169000, days: 365, maxUniqueIps: 5 },
] as const;

export type PlanId = Plan["id"];

export function getPlan(id: string): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}
