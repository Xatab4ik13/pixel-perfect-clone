import { useDemo } from '@/components/DemoProvider';
import { IconImg } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import shield from '@/assets/icon-shield.jpg';
import calendar from '@/assets/icon-calendar.png';

export function AccessStatus() {
  const { days, link } = useDemo();
  const openLink = () => {
    if (!link) return;
    const app = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (u: string) => void } } }).Telegram?.WebApp;
    if (app?.openTelegramLink) app.openTelegramLink(link.replace('tg://', 'https://t.me/'));
    else window.location.href = link;
  };
  return <div className={`mt-6 rounded-2xl p-5 shadow-soft ${days ? 'bg-gradient-success' : 'bg-card'}`}>
    <div className="flex items-center gap-3"><IconImg src={days ? shield : calendar} className={`h-12 w-12 rounded-xl ${days ? '' : 'grayscale opacity-60'}`} /><div><p className="text-lg font-extrabold">{days ? 'Доступ активен' : 'Доступ не оплачен'}</p><p className="mt-1 text-xs text-muted-foreground">{days ? `Оплачен · осталось ${days} дней` : 'Выберите тариф, чтобы подключиться'}</p></div></div>
    {days > 0 && link && <Button onClick={openLink} className="mt-4 h-12 w-full rounded-2xl bg-gradient-primary shadow-button"><ArrowUpRight />Подключить</Button>}
    {days > 0 && !link && <p className="mt-4 border-t border-success/20 pt-3 text-xs text-muted-foreground">Подписка оплачена. Подключение — по кнопке выше, как только появится ссылка.</p>}
  </div>;
}