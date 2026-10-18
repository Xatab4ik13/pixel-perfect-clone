import { createFileRoute, Link } from '@tanstack/react-router';
import { Check, ChevronRight } from 'lucide-react';
import { AppShell, IconImg, Logo } from '@/components/AppShell';
import { AccessStatus } from '@/components/AccessStatus';
import { useDemo } from '@/components/DemoProvider';
import { Button } from '@/components/ui/button';
import profileIcon from '@/assets/icon-profile.png';
import { DEMO_PLANS } from '@/lib/demo-access';

export const Route = createFileRoute('/profile')({
  head: () => ({ meta: [
      { property: "og:description", content: "Ваш аккаунт, доступ и история оплат в Лазейке." },

    { title: 'Личный кабинет — Лазейка' },
    { name: 'description', content: 'Ваш аккаунт, доступ и история оплат в Лазейке.' },
    { property: 'og:title', content: 'Личный кабинет — Лазейка' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
  ] }), component: Profile,
});

function planName(planId: string | null): string {
  const p = DEMO_PLANS.find((x) => x.id === planId);
  return p ? p.name : planId ?? 'Доступ';
}

function Profile() {
  const { user, history } = useDemo();
  const displayName = user?.firstName || (user?.username ? `@${user.username}` : 'Пользователь Telegram');
  const paid = history.filter((h) => h.status === 'paid');
  return (
    <AppShell>
      <Logo small />
      <div className="mt-7 flex items-center gap-4">
        <IconImg src={profileIcon} className="h-20 w-20" />
        <div>
          <h2 className="text-xl font-extrabold">{displayName}</h2>
          {user?.username && <p className="mt-1 text-sm text-muted-foreground">@{user.username}</p>}
          <p className="mt-1 text-xs text-muted-foreground">ID: {user?.telegramUserId ?? '…'}</p>
        </div>
      </div>

      <AccessStatus />
      <Button asChild className="mt-4 h-12 rounded-2xl bg-gradient-primary">
        <Link to="/access">Управлять доступом<ChevronRight /></Link>
      </Button>

      <section className="mt-8" aria-labelledby="payment-history-title">
        <h2 id="payment-history-title" className="text-lg font-extrabold">История оплат</h2>
        {paid.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft">
            Оплат пока нет. Оформите доступ в разделе «Мой доступ».
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {paid.map((p) => (
              <article key={p.id} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                    <Check className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold">Доступ · {planName(p.planId)}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-extrabold">{p.amount.toLocaleString('ru-RU')} ₽</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="font-semibold text-success">Оплачено</span>
                  <span className="text-muted-foreground">+{p.days} дней доступа</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
