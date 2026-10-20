import { useState } from 'react';
import { Copy, Send, Check } from 'lucide-react';
import { IconImg } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/components/DemoProvider';
import gift from '@/assets/icon-gift.png';

interface TgWebApp {
  openTelegramLink?: (url: string) => void;
}
function webApp(): TgWebApp | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp ?? null;
}

export function Invitations() {
  const { referral } = useDemo();
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const link = referral?.link ?? '';
  const invited = referral?.invited ?? 0;
  const rewarded = referral?.rewarded ?? 0;
  const perFriend = referral?.perFriendDays ?? 30;
  const earned = referral?.rewardDays ?? 0;

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setMessage('Ссылка скопирована');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setMessage('Выделите ссылку и скопируйте её');
    }
  }

  function share() {
    if (!link) return;
    const text = 'Присоединяйся к Лазейке — стабильное соединение в одно нажатие.';
    const app = webApp();
    // Open Telegram's native "share to chat" dialog with our invite link.
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    if (app?.openTelegramLink) app.openTelegramLink(shareUrl);
    else window.open(shareUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <section id="invitations" className="mt-7 scroll-mt-6" aria-labelledby="invitations-title">
      <div className="flex items-center gap-3">
        <IconImg src={gift} className="h-12 w-12" />
        <div>
          <h2 id="invitations-title" className="text-lg font-extrabold">Пригласить друзей</h2>
          <p className="mt-1 text-xs text-muted-foreground">+{perFriend} дней, когда друг оформит доступ</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 text-center shadow-soft">
          <div className="referral-ring mx-auto flex h-24 w-24 items-center justify-center rounded-full">
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card">
              <strong className="text-3xl font-extrabold">{invited}</strong>
              <span className="text-xs text-muted-foreground">{invited === 1 ? 'друг' : 'друзей'}</span>
            </div>
          </div>
          <p className="mt-3 text-sm font-bold">Приглашено</p>
          <p className="mt-1 text-xs text-muted-foreground">{rewarded} оплатили</p>
        </div>
        <div className="rounded-2xl bg-card p-4 text-center shadow-soft">
          <div className="referral-ring reward-ring mx-auto flex h-24 w-24 items-center justify-center rounded-full">
            <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card">
              <strong className="text-3xl font-extrabold text-success">+{earned}</strong>
              <span className="text-xs text-muted-foreground">дней</span>
            </div>
          </div>
          <p className="mt-3 text-sm font-bold">Начислено</p>
          <p className="mt-1 text-xs text-muted-foreground">За оплативших друзей</p>
        </div>
      </div>

      <label htmlFor="invitation-link" className="mt-5 block text-sm font-bold">Ваша личная ссылка</label>
      <input
        id="invitation-link"
        aria-label="Ссылка приглашения"
        value={link}
        readOnly
        onFocus={(e) => e.target.select()}
        className="mt-2 h-12 w-full min-w-0 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground"
      />
      <div className="mt-3 flex gap-3">
        <Button onClick={share} disabled={!link} className="h-12 flex-1 rounded-2xl bg-gradient-primary shadow-button"><Send />Пригласить друга</Button>
        <Button onClick={copy} disabled={!link} variant="outline" className="h-12 w-12 rounded-2xl" aria-label="Скопировать ссылку" title="Скопировать ссылку">
          {copied ? <Check /> : <Copy />}
        </Button>
      </div>
      {message && <p role="status" className="mt-3 text-center text-sm text-primary">{message}</p>}
      <p className="mt-3 text-center text-xs text-muted-foreground">Награда начисляется автоматически после первой оплаты друга.</p>
    </section>
  );
}
