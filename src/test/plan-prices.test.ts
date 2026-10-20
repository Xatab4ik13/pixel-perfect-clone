import { describe, expect, it } from 'vitest';
import { PLANS } from '@/lib/plans';
import { DEMO_PLANS } from '@/lib/demo-access';

describe('plan prices', () => {
  it('month costs 349 ₽', () => expect(PLANS.find((p) => p.id === 'month')?.priceKopecks).toBe(34900));
  it('3 months cost 849 ₽', () => expect(PLANS.find((p) => p.id === 'quarter')?.priceKopecks).toBe(84900));
  it('12 months cost 2490 ₽', () => expect(PLANS.find((p) => p.id === 'year')?.priceKopecks).toBe(249000));
  it('app shows the same prices as the server', () =>
    expect(DEMO_PLANS.map((p) => p.price)).toEqual([349, 849, 2490]));
});
