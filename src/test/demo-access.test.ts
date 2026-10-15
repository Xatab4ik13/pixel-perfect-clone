import { describe, expect, it } from 'vitest';
import { accessIsPaid, applyDemoPayment, DEMO_PLANS } from '@/lib/demo-access';
describe('Mock access payment', () => {
  it('starts unpaid when no days are purchased', () => { expect(accessIsPaid(0)).toBe(false); });
  it('makes a purchased month active', () => { const days = applyDemoPayment(0, DEMO_PLANS[0]); expect(days).toBe(30); expect(accessIsPaid(days)).toBe(true); });
  it('extends existing days rather than replacing them', () => { expect(applyDemoPayment(28, DEMO_PLANS[0])).toBe(58); });
});