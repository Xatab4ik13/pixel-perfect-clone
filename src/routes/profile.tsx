import { createFileRoute, Link } from '@tanstack/react-router';
import { Check, ChevronRight } from 'lucide-react';
import { AppShell, IconImg, Logo } from '@/components/AppShell';
import { AccessStatus } from '@/components/AccessStatus';
import { useDemo } from '@/components/DemoProvider';
import { Button } from '@/components/ui/button';
import profile from '@/assets/icon-profile.png';
import { Invitations } from '@/components/Invitations';
import { DEMO_PAYMENT_HISTORY } from '@/lib/demo-access';

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [
    { title: 'Личный кабинет — Лазейка' },
    { name: 'description', content: 'Ваш Telegram-аккаунт, доступ и история оплат в Лазейке.' },
    { property: 'og:title', content: 'Личный кабинет — Лазейка' },
    { property: 'og:description', content: 'Ваш аккаунт, подписка и приглашения друзей.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }), component: Profile,
});
function Profile() {
  const { code, payments, reset } = useDemo();
  return <AppShell><Logo small />
    <div className="mt-7 flex items-center gap-4"><IconImg src={profile} className="h-20 w-20" /><div><h2 className="text-xl font-extrabold">Личный кабинет</h2><p className="mt-1 text-sm text-muted-foreground">Пользователь Telegram</p><p className="mt-1 text-xs text-muted-foreground">ID: {code || '…'} · тестовый аккаунт</p></div></div>
    <AccessStatus />
    <Button asChild className="mt-4 h-12 rounded-2xl bg-gradient-primary"><Link to="/access">Управлять доступом<ChevronRight /></Link></Button>
    <Invitations />
    <section className="mt-8" aria-labelledby="payment-history-title">
      <div className="flex items-center justify-between"><h2 id="payment-history-title" className="text-lg font-extrabold">История оплат</h2><span className="text-xs text-muted-foreground">Демо</span></div>
      <div className="mt-4 space-y-3">{[...payments, ...DEMO_PAYMENT_HISTORY].map((payment, index) => <article key={index} className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success"><Check className="h-5 w-5" aria-hidden="true" /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-bold">Доступ · {payment.name}</h3><p className="mt-1 text-xs text-muted-foreground">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'Тестовая операция'}</p></div><p className="shrink-0 text-base font-extrabold">{payment.price.toLocaleString('ru-RU')} ₽</p></div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs"><span className="font-semibold text-success">Оплачено</span><span className="text-muted-foreground">+{payment.days} дней доступа</span></div>
      </article>)}</div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Тестовые операции · без реальных списаний</p>
    </section>
    <Button variant="ghost" onClick={reset} className="mt-6 self-center text-xs text-muted-foreground">Сбросить тестовую оплату</Button>
  </AppShell>;
}