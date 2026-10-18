import { createFileRoute } from '@tanstack/react-router';
import { AppShell, Logo } from '@/components/AppShell';
import { Invitations } from '@/components/Invitations';

export const Route = createFileRoute('/referrals')({
  head: () => ({
    meta: [
      { property: "og:description", content: "Приглашайте друзей и получайте дни доступа в подарок." },

      { title: 'Пригласить друзей — Лазейка' },
      { name: 'description', content: 'Приглашайте друзей и получайте дни доступа в подарок.' },
      { property: 'og:title', content: 'Пригласить друзей — Лазейка' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
  }),
  component: Referrals,
});

function Referrals() {
  return (
    <AppShell>
      <Logo small />
      <Invitations />
    </AppShell>
  );
}
