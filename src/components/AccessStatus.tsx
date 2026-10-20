import { useDemo } from '@/components/DemoProvider';
import { IconImg } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import shield from '@/assets/icon-shield.webp';
import calendar from '@/assets/icon-calendar.webp';

export function AccessStatus({ ring = false }: { ring?: boolean }) {
  const { days, link } = useDemo();
  const openLink = () => {
    if (!link) return;
    const app = (window as unknown as { Telegram?: { WebApp?: { openTelegramLink?: (u: string) => void } } }).Telegram?.WebApp;
    if (app?.openTelegramLink) app.openTelegramLink(link.replace('tg://', 'https://t.me/'));
    else window.location.href = link;
  };
  return <div className={`mt-6 rounded-2xl p-5 shadow-soft ${days ? 'bg-gradient-success' : 'bg-card'}`}>
    {ring ? <div className="flex items-center gap-5"><div className="access-ring flex h-28 w-28 shrink-0 items-center justify-center rounded-full" style={{ ['--p' as string]: Math.min(100, Math.round((days / 90) * 100)) }}><div className="flex h-[5.75rem] w-[5.75rem] flex-col items-center justify-center rounded-full bg-card"><span className="text-3xl font-extrabold leading-none tabular-nums">{days}</span><span className="mt-1 text-[11px] text-muted-foreground">{dayWord(days)}</span></div></div><div><p className="text-lg font-extrabold">{days ? 'Доступ активен' : 'Доступ не оплачен'}</p><p className="mt-1 text-xs text-muted-foreground">{days ? 'До окончания доступа' : 'Выберите тариф, чтобы подключиться'}</p></div></div> :
    <div className="flex items-center gap-3"><IconImg src={days ? shield : calendar} className={`h-12 w-12 rounded-xl ${days ? '' : 'grayscale opacity-60'}`} /><div><p className="text-lg font-extrabold">{days ? 'Доступ активен' : 'Доступ не оплачен'}</p><p className="mt-1 text-xs text-muted-foreground">{days ? `Оплачен · осталось ${days} дней` : 'Выберите тариф, чтобы подключиться'}</p></div></div>}
    {days > 0 && link && <Button onClick={openLink} className="mt-4 h-12 w-full rounded-2xl bg-gradient-primary shadow-button"><ArrowUpRight />Подключить</Button>}
    {days > 0 && !link && <p className="mt-4 border-t border-success/20 pt-3 text-xs text-muted-foreground">Подписка оплачена. Подключение — по кнопке выше, как только появится ссылка.</p>}
  </div>;
}

function dayWord(n: number): string {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return 'день';
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'дня';
  return 'дней';
}
