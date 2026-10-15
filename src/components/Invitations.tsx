import { useState } from 'react';
import { Copy, Send } from 'lucide-react';
import { IconImg } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/components/DemoProvider';
import { rewardDays } from '@/lib/referral-rules';
import gift from '@/assets/icon-gift.png';

export function Invitations() {
  const { code } = useDemo();
  const [message, setMessage] = useState('');
  const friends = 3;
  const days = rewardDays(friends);
  const link = `https://t.me/lazeyka_demo_bot?start=ref_${code || 'demo'}`;
  async function copy() {
    try { await navigator.clipboard.writeText(link); setMessage('Ссылка скопирована'); }
    catch { setMessage('Выделите ссылку и скопируйте её'); }
  }
  async function share() {
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title: 'Лазейка', text: 'Присоединяйся к Лазейке', url: link }); }
    catch { /* Dismissing sharing is not an error. */ }
  }
  return <section id="invitations" className="mt-7 scroll-mt-6" aria-labelledby="invitations-title">
    <div className="flex items-center gap-3"><IconImg src={gift} className="h-12 w-12" /><div><h2 id="invitations-title" className="text-lg font-extrabold">Мои приглашения</h2><p className="mt-1 text-xs text-muted-foreground">+30 дней за друга на следующий месяц</p></div></div>
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-card p-4 text-center shadow-soft"><div className="referral-ring mx-auto flex h-24 w-24 items-center justify-center rounded-full"><div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card"><strong className="text-3xl font-extrabold">{friends}</strong><span className="text-xs text-muted-foreground">друга</span></div></div><p className="mt-3 text-sm font-bold">Приглашено</p><p className="mt-1 text-xs text-muted-foreground">Следующая отметка: 5</p></div>
      <div className="rounded-2xl bg-card p-4 text-center shadow-soft"><div className="referral-ring reward-ring mx-auto flex h-24 w-24 items-center justify-center rounded-full"><div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card"><strong className="text-3xl font-extrabold text-success">+{days}</strong><span className="text-xs text-muted-foreground">дней</span></div></div><p className="mt-3 text-sm font-bold">Получено</p><p className="mt-1 text-xs text-muted-foreground">На следующий месяц</p></div>
    </div>
    <p className="mt-3 text-center text-xs text-muted-foreground">Пример начислений · 3 друга × 30 дней</p>
    <label htmlFor="invitation-link" className="mt-5 block text-sm font-bold">Ваша личная ссылка</label>
    <input id="invitation-link" aria-label="Ссылка приглашения" value={link} readOnly onFocus={e => e.target.select()} className="mt-2 h-12 w-full min-w-0 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground" />
    <div className="mt-3 flex gap-3"><Button onClick={share} className="h-12 flex-1 rounded-2xl bg-gradient-primary shadow-button"><Send />Пригласить друга</Button><Button onClick={copy} variant="outline" className="h-12 w-12 rounded-2xl" aria-label="Скопировать ссылку" title="Скопировать ссылку"><Copy /></Button></div>
    {message && <p role="status" className="mt-3 text-center text-sm text-primary">{message}</p>}
    <p className="mt-3 text-center text-xs text-muted-foreground">Демонстрационная ссылка Telegram-бота</p>
  </section>;
}