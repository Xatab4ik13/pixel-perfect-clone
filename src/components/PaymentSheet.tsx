import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowUpRight, Clock3, Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/components/DemoProvider';
import type { DemoPlan } from '@/lib/demo-access';
import { SbpMark } from '@/components/SbpMark';
import sbpIcon from '@/assets/icon-sbp.svg';

const WINDOW_SECONDS = 20 * 60; // 20 минут на оплату

type Stage = 'creating' | 'ready' | 'error' | 'done';

interface TgWebApp {
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
}
function webApp(): TgWebApp | null {
  if (typeof window === 'undefined') return null;
  return (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp ?? null;
}

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function PaymentSheet({ plan, onClose }: { plan: DemoPlan | null; onClose: () => void }) {
  const { pay, refresh, days } = useDemo();
  const [stage, setStage] = useState<Stage>('creating');
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(WINDOW_SECONDS);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const startedFor = useRef<string | null>(null);
  const baselineDays = useRef(0);

  // Создаём платёж сразу при открытии окна (один раз на план).
  useEffect(() => {
    if (!plan) { startedFor.current = null; return; }
    if (startedFor.current === plan.id) return;
    startedFor.current = plan.id;
    baselineDays.current = days;
    setStage('creating');
    setUrl(null);
    setError(null);
    setSeconds(WINDOW_SECONDS);
    setCopied(false);
    (async () => {
      try {
        const link = await pay(plan);
        if (link) { setUrl(link); setStage('ready'); }
        else { setError('Не удалось создать платёж. Попробуйте ещё раз.'); setStage('error'); }
      } catch {
        setError('Не удалось создать платёж. Попробуйте ещё раз.');
        setStage('error');
      }
    })();
  }, [plan, pay]);

  // Обратный отсчёт 20 минут.
  useEffect(() => {
    if (stage !== 'ready') return;
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, seconds]);

  // Пока окно открыто — тихо опрашиваем статус, чтобы автоматически поймать
  // подтверждение оплаты (webhook банка) без действий пользователя.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    if (stage !== 'ready') return;
    const iv = setInterval(() => { void refreshRef.current(); }, 5000);
    return () => clearInterval(iv);
  }, [stage]);

  // Активация приходит через webhook оплаты — ловим рост числа дней после refresh().
  useEffect(() => {
    if (stage === 'ready' && days > baselineDays.current) setStage('done');
  }, [days, stage]);

  const expired = stage === 'ready' && seconds <= 0;

  const copyLink = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard недоступен — пользователь может перейти по кнопке */ }
  };

  const openExternal = () => {
    if (!url) return;
    const app = webApp();
    // Открываем во внешнем (стандартном) браузере пользователя.
    if (app?.openLink) app.openLink(url, { try_instant_view: false });
    else window.open(url, '_blank', 'noopener,noreferrer');
  };

  const retry = () => { if (plan) { startedFor.current = null; setStage('creating'); } };

  const checkPaid = async () => {
    setChecking(true);
    try {
      await refresh(); // если доступ активирован, эффект выше переключит на 'done'
    } finally { setChecking(false); }
  };

  return (
    <Sheet open={Boolean(plan)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="bottom" className="mx-auto max-h-[94dvh] max-w-md overflow-y-auto rounded-t-3xl bg-card px-5 pb-7 pt-3">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between gap-3">
          <div>
            <SheetTitle className="text-left text-2xl font-extrabold">Оплата</SheetTitle>
            <SheetDescription className="mt-1 text-left">
              {plan?.name} · {plan?.price.toLocaleString('ru-RU')} ₽
            </SheetDescription>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2">
            <SbpMark className="h-7" />
            <span className="text-left text-[10px] font-bold leading-tight text-muted-foreground">Система<br />быстрых платежей</span>
          </div>
        </div>

        {stage === 'creating' && (
          <div className="my-12 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Готовим оплату…</p>
          </div>
        )}

        {stage === 'error' && (
          <div className="my-10 flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={retry} className="h-12 w-full rounded-2xl bg-gradient-primary"><RefreshCw />Попробовать снова</Button>
            <Button variant="secondary" onClick={onClose} className="h-12 w-full rounded-2xl">Закрыть</Button>
          </div>
        )}

        {stage === 'done' && (
          <div className="my-10 flex flex-col items-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success"><Check className="h-7 w-7" /></span>
            <p className="text-base font-bold">Оплата получена</p>
            <p className="text-sm text-muted-foreground">Доступ активирован. Вернитесь на главный экран, чтобы подключиться.</p>
            <Button onClick={onClose} className="h-12 w-full rounded-2xl bg-gradient-primary">Готово</Button>
          </div>
        )}

        {stage === 'ready' && url && (
          <>
            <div className={`mt-4 flex items-center justify-center gap-2 rounded-2xl py-2 text-sm font-bold ${expired ? 'bg-destructive/10 text-destructive' : 'bg-sky text-primary'}`}>
              <Clock3 className="h-4 w-4" />
              {expired ? 'Время истекло' : <>Оплатите за <span className="tabular-nums">{mmss(seconds)}</span></>}
            </div>

            <div className="my-5 flex justify-center">
              <div className={`rounded-2xl bg-white p-4 shadow-soft ${expired ? 'opacity-40' : ''}`}>
                <QRCodeSVG value={url} size={200} level="H" imageSettings={{ src: sbpIcon, height: 40, width: 32, excavate: true }} />
              </div>
            </div>
            <p className="mb-5 text-center text-xs text-muted-foreground">
              Отсканируйте QR камерой или приложением банка, либо перейдите по ссылке.
            </p>

            {expired ? (
              <Button onClick={retry} className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-button"><RefreshCw />Создать заново</Button>
            ) : (
              <>
                <Button onClick={openExternal} className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-button">
                  <SbpMark />
                  Перейти к оплате<ArrowUpRight />
                </Button>
                <Button variant="secondary" onClick={copyLink} className="mt-3 h-12 w-full rounded-2xl">
                  {copied ? <><Check />Скопировано</> : <><Copy />Скопировать ссылку</>}
                </Button>
                <Button variant="ghost" onClick={checkPaid} disabled={checking} className="mt-2 h-11 w-full rounded-2xl text-muted-foreground">
                  {checking ? <Loader2 className="animate-spin" /> : <RefreshCw />}Я оплатил — проверить
                </Button>
              </>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
