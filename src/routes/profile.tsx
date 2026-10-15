import { createFileRoute, Link } from '@tanstack/react-router';
import { ChevronRight } from 'lucide-react';
import { AppShell, IconImg, Logo } from '@/components/AppShell';
import { AccessStatus } from '@/components/AccessStatus';
import { useDemo } from '@/components/DemoProvider';
import { Button } from '@/components/ui/button';
import profile from '@/assets/icon-profile.png';
import gift from '@/assets/icon-gift.png';

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
    <Button asChild variant="ghost" className="mt-5 h-auto justify-start rounded-2xl bg-card p-4 shadow-soft"><Link to="/referrals"><IconImg src={gift} /><span className="flex-1 text-left font-bold">Мои приглашения</span><ChevronRight /></Link></Button>
    <h2 className="mt-7 text-lg font-bold">История оплат</h2>
    {payments.length ? <div className="mt-3 divide-y divide-border">{payments.map((payment, index) => <div key={index} className="flex items-center justify-between py-4"><div><p className="text-sm font-bold">{payment.name}</p><p className="mt-1 text-xs text-success">Оплачено · тестовая операция</p></div><p className="font-bold">{payment.price.toLocaleString('ru-RU')} ₽</p></div>)}</div> : <p className="mt-3 border-y border-border py-5 text-sm text-muted-foreground">Оплат пока нет</p>}
    <Button variant="ghost" onClick={reset} className="mt-6 self-center text-xs text-muted-foreground">Сбросить тестовую оплату</Button>
  </AppShell>;
}