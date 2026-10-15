import { useDemo } from '@/components/DemoProvider';
import { IconImg } from '@/components/AppShell';
import shield from '@/assets/icon-shield.jpg';
import calendar from '@/assets/icon-calendar.png';

export function AccessStatus() {
  const { days } = useDemo();
  return <div className={`mt-6 rounded-2xl p-5 shadow-soft ${days ? 'bg-gradient-success' : 'bg-card'}`}>
    <div className="flex items-center gap-3"><IconImg src={days ? shield : calendar} className={`h-12 w-12 rounded-xl ${days ? '' : 'grayscale opacity-60'}`} /><div><p className="text-lg font-extrabold">{days ? 'Доступ активен' : 'Доступ не оплачен'}</p><p className="mt-1 text-xs text-muted-foreground">{days ? `Оплачен · осталось ${days} дней` : 'Выберите тариф, чтобы подключиться'}</p></div></div>
    {days > 0 && <p className="mt-4 border-t border-success/20 pt-3 text-xs text-muted-foreground">Подписка оплачена. Подключение — отдельно в Telegram.</p>}
  </div>;
}