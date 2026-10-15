import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { applyDemoPayment, type DemoPlan } from '@/lib/demo-access';

type Payment = { name: string; price: number; days: number };
type DemoState = { days: number; payments: Payment[]; code: string; pay: (plan: DemoPlan) => void; reset: () => void };
const DemoContext = createContext<DemoState | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState(0);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [code, setCode] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('lazeyka-demo') ?? 'null');
      if (saved && typeof saved === 'object' && 'days' in saved && typeof saved.days === 'number') setDays(saved.days);
      if (saved && typeof saved === 'object' && 'payments' in saved && Array.isArray(saved.payments)) {
        setPayments(saved.payments.filter((item): item is Payment => Boolean(item) && typeof item === 'object' && typeof item.name === 'string' && typeof item.price === 'number' && typeof item.days === 'number'));
      }
    } catch { /* An unreadable demo starts unpaid. */ }
    const storedCode = localStorage.getItem('lazeyka-demo-code') || crypto.randomUUID().slice(0, 8);
    localStorage.setItem('lazeyka-demo-code', storedCode);
    setCode(storedCode); setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem('lazeyka-demo', JSON.stringify({ days, payments })); }, [days, payments, ready]);
  const pay = (plan: DemoPlan) => { setDays(value => applyDemoPayment(value, plan)); setPayments(value => [{ name: plan.name, price: plan.price, days: plan.days }, ...value]); };
  return <DemoContext.Provider value={{ days, payments, code, pay, reset: () => { setDays(0); setPayments([]); } }}>{children}</DemoContext.Provider>;
}
export function useDemo() {
  const state = useContext(DemoContext);
  if (!state) throw new Error('DemoProvider is required');
  return state;
}