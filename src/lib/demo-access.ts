export const DEMO_PLANS = [
  { id: 'month', name: '1 месяц', price: 349, days: 30 },
  { id: 'quarter', name: '3 месяца', price: 849, days: 90 },
  { id: 'year', name: '12 месяцев', price: 2490, days: 365 },
] as const;
export type DemoPlan = typeof DEMO_PLANS[number];
export type DemoPayment = { name: string; price: number; days: number; paidAt?: string };
// Historical examples are display-only and never grant current access.
export const DEMO_PAYMENT_HISTORY: DemoPayment[] = [
  { ...DEMO_PLANS[0], paidAt: '2026-08-12T12:24:00Z' },
  { ...DEMO_PLANS[1], paidAt: '2026-05-12T09:10:00Z' },
  { ...DEMO_PLANS[0], paidAt: '2026-04-12T15:42:00Z' },
];
export function applyDemoPayment(currentDays: number, plan: DemoPlan) {
  return Math.max(0, currentDays) + plan.days;
}
export function accessIsPaid(days: number) { return days > 0; }