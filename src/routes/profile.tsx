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
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    const u = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { photo_url?: string } } } } }).Telegram?.WebApp?.initDataUnsafe?.user;
    if (u?.photo_url) setPhoto(u.photo_url);
  }, []);
  const initial = (user?.firstName || user?.username || 'Л').slice(0, 1).toUpperCase();
  return (
    <AppShell>
      <Logo small />
      <div className="mt-7 flex items-center gap-4">
        <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-primary text-3xl font-extrabold text-primary-foreground shadow-button ring-4 ring-card">
          {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : user ? initial : <IconImg src={profileIcon} className="h-20 w-20" />}
        </span>
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
          <ol className="relative mt-4 rounded-2xl bg-card p-4 shadow-soft">
            {paid.map((p, i) => (
              <li key={p.id} className="relative flex gap-3 pb-5 last:pb-0">
                {i < paid.length - 1 && <span className="absolute left-5 top-10 bottom-0 w-px bg-border" aria-hidden="true" />}
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky text-primary">
                  <Receipt className="h-5 w-5" aria-hidden="true" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success text-success-foreground ring-2 ring-card"><Check className="h-2.5 w-2.5" aria-hidden="true" /></span>
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold">{planName(p.planId)}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {p.paidAt ? new Date(p.paidAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} · +{p.days} дней
                  </p>
                </div>
                <p className="shrink-0 text-base font-extrabold">{p.amount.toLocaleString('ru-RU')} ₽</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </AppShell>
  );
}
