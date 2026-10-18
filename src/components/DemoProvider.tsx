import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { applyDemoPayment, type DemoPlan, type DemoPayment } from '@/lib/demo-access';

export type HistoryItem = {
  id: string;
  planId: string | null;
  amount: number;
  status: string;
  days: number;
  paidAt: string | null;
};

export type TgUser = {
  telegramUserId: number;
  firstName: string | null;
  username: string | null;
};

export type ReferralInfo = {
  code: string;
  invited: number;
  rewarded: number;
  rewardDays: number;
  perFriendDays: number;
  link: string;
};

type AccessState = {
  days: number;
  /** Local demo payments (browser preview only). */
  payments: DemoPayment[];
  /** Real payment history (Telegram mode). */
  history: HistoryItem[];
  code: string;
  /** Owner's ee-link, only present in Telegram when access is active. */
  link: string | null;
  /** Current period end ISO (Telegram mode), if any. */
  periodEnd: string | null;
  /** Authenticated Telegram user (Telegram mode). */
  user: TgUser | null;
  /** Referral stats + personal invite link (Telegram mode). */
  referral: ReferralInfo | null;
  /** True when running inside Telegram (real backend), false in browser. */
  isTelegram: boolean;
  loading: boolean;
  /** Bot @username for the browser gate link (if configured). */
  botUsername: string | null;
  /** Creates a payment and returns the external payment URL (or null in browser demo). */
  pay: (plan: DemoPlan) => Promise<string | null>;
  refresh: () => Promise<void>;
  reset: () => void;
};
const DemoContext = createContext<AccessState | null>(null);

interface TelegramWebApp {
  initData?: string;
  ready?: () => void;
  expand?: () => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
}
function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { Telegram?: { WebApp?: TelegramWebApp } };
  const app = w.Telegram?.WebApp;
  return app && typeof app.initData === 'string' && app.initData.length > 0 ? app : null;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [days, setDays] = useState(0);
  const [payments, setPayments] = useState<DemoPayment[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [code, setCode] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [user, setUser] = useState<TgUser | null>(null);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const initData = useRef('');

  const tma = (path: string, init?: RequestInit) =>
    fetch(path, {
      ...init,
      headers: {
        'content-type': 'application/json',
        authorization: `tma ${initData.current}`,
        ...(init?.headers ?? {}),
      },
    });

  const refreshLive = async () => {
    try {
      const me = (await tma('/api/me').then((r) => r.json())) as {
        user?: { telegramUserId: number; firstName: string | null; username: string | null };
        access: { daysLeft: number; hasLink: boolean; currentPeriodEnd: string | null };
      };
      setDays(me.access.daysLeft);
      setPeriodEnd(me.access.currentPeriodEnd);
      if (me.user) setUser({ telegramUserId: me.user.telegramUserId, firstName: me.user.firstName, username: me.user.username });
      if (me.access.hasLink) {
        const l = (await tma('/api/me/link').then((r) => r.json())) as { link: string | null };
        setLink(l.link);
      } else {
        setLink(null);
      }
      const h = (await tma('/api/me/payments').then((r) => r.json())) as { payments: HistoryItem[] };
      setHistory(Array.isArray(h.payments) ? h.payments : []);
      const ref = (await tma('/api/me/referrals').then((r) => r.json())) as ReferralInfo;
      if (ref && typeof ref.code === 'string') setReferral(ref);
    } catch {
      setDays(0);
      setLink(null);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Keep a stable reference so event listeners always call the latest refresh.
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  refreshRef.current = refreshLive;

  // When the user returns to the Mini App (e.g. back from the bank's payment
  // page), re-fetch status so a freshly-activated subscription shows up.
  useEffect(() => {
    if (!isTelegram) return;
    const onVisible = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') void refreshRef.current();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [isTelegram]);

  useEffect(() => {
    const storedCode = localStorage.getItem('lazeyka-demo-code') || crypto.randomUUID().slice(0, 8);
    localStorage.setItem('lazeyka-demo-code', storedCode);
    setCode(storedCode);

    // Non-sensitive public config (bot username for the browser gate).
    void fetch('/api/config').then((r) => r.json()).then((c: { botUsername?: string | null }) => setBotUsername(c.botUsername ?? null)).catch(() => {});

    const app = getWebApp();
    if (app) {
      app.ready?.();
      app.expand?.();
      initData.current = app.initData ?? '';
      setIsTelegram(true);
      void refreshLive();
      setReady(true);
      return;
    }

    // Browser preview: no backend calls, the UI shows a "open in Telegram" gate.
    setLoading(false);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !isTelegram) localStorage.setItem('lazeyka-demo', JSON.stringify({ days, payments }));
  }, [days, payments, ready, isTelegram]);

  const pay = async (plan: DemoPlan): Promise<string | null> => {
    if (isTelegram) {
      const res = (await tma('/api/pay', { method: 'POST', body: JSON.stringify({ planId: plan.id }) }).then((r) => r.json())) as {
        paid?: boolean;
        confirmationUrl?: string | null;
      };
      return res.confirmationUrl ?? null;
    }
    // Browser preview demo.
    setDays((value) => applyDemoPayment(value, plan));
    setPayments((value) => [{ name: plan.name, price: plan.price, days: plan.days, paidAt: new Date().toISOString() }, ...value]);
    return null;
  };

  return (
    <DemoContext.Provider
      value={{
        days,
        payments,
        history,
        code,
        link,
        periodEnd,
        user,
        referral,
        isTelegram,
        loading,
        botUsername,
        pay,
        refresh: refreshLive,
        reset: () => { setDays(0); setPayments([]); setLink(null); },
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const state = useContext(DemoContext);
  if (!state) throw new Error('DemoProvider is required');
  return state;
}
