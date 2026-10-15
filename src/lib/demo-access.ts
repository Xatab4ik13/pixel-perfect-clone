export const DEMO_PLANS = [
  { id: 'month', name: '1 месяц', price: 199, days: 30 },
  { id: 'quarter', name: '3 месяца', price: 499, days: 90 },
  { id: 'year', name: '12 месяцев', price: 1690, days: 365 },
] as const;
export type DemoPlan = typeof DEMO_PLANS[number];
export function applyDemoPayment(currentDays: number, plan: DemoPlan) {
  return Math.max(0, currentDays) + plan.days;
}
export function accessIsPaid(days: number) { return days > 0; }