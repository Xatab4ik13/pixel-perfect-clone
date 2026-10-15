import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, ArrowUpRight, Clock3, RefreshCw } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useDemo } from '@/components/DemoProvider';
import type { DemoPlan } from '@/lib/demo-access';

export function PaymentSheet({ plan, onClose }: { plan: DemoPlan | null; onClose: () => void }) {
  const { pay, code } = useDemo();
  const [seconds, setSeconds] = useState(1200);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (plan) { setSeconds(1200); setSuccess(false); setCopied(false); } }, [plan]);
  useEffect(() => {
    if (!plan || success) return;
    const timer = setInterval(() => setSeconds(value => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [plan, success]);
  const url = `https://payment.invalid/lazeyka/${code}/${plan?.id ?? 'month'}`;
  return <Sheet open={Boolean(plan)} onOpenChange={open => { if (!open) onClose(); }}>
    <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-md overflow-y-auto rounded-t-3xl bg-card px-5 pb-7 pt-3">
      <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border" />
      <SheetTitle className="text-left text-2xl font-extrabold">{success ? 'Доступ оплачен' : 'Ссылка на оплату'}</SheetTitle>
      <SheetDescription className="mt-2 text-left">{success ? `${plan?.days} дней добавлено к вашему доступу` : `${plan?.name} · ${plan?.price.toLocaleString('ru-RU')} ₽ · тестовая оплата`}</SheetDescription>
      {success ? <>
        <div className="my-8 flex flex-col items-center gap-4"><div className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success"><Check className="h-10 w-10" /></div><p className="text-lg font-bold">Всё готово к подключению</p><p className="text-sm text-muted-foreground">Деньги не списывались</p></div>
        <Button onClick={onClose} className="h-12 w-full rounded-2xl bg-gradient-primary">Готово</Button>
      </> : <>
        <div className="my-5 flex h-64 w-full items-center justify-center rounded-3xl bg-muted p-5"><div className="payment-qr rounded-2xl bg-card p-4"><QRCodeSVG value={url} size={190} level="M" bgColor="transparent" fgColor="currentColor" title="QR-код тестовой оплаты" /></div></div>
        <div className="flex items-center justify-between rounded-2xl bg-muted p-4"><span className="text-sm font-semibold">{seconds ? 'Ссылка активна' : 'Срок ссылки истёк'}</span><span className="flex items-center gap-2 rounded-xl border border-primary px-3 py-2 text-sm font-bold"><Clock3 className="h-4 w-4 text-primary" />{Math.floor(seconds / 60).toString().padStart(2, '0')}:{(seconds % 60).toString().padStart(2, '0')}</span></div>
        <p className="my-4 text-center text-xs leading-relaxed text-muted-foreground">Тестовая ссылка. Реального списания не будет.</p>
        <Button variant="secondary" className="mb-3 h-12 w-full rounded-2xl text-primary" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setCopied(false); } }}><Copy />{copied ? 'Ссылка скопирована' : 'Скопировать ссылку'}</Button>
        {seconds ? <Button className="h-12 w-full rounded-2xl bg-gradient-primary shadow-button" onClick={() => { if (plan) { pay(plan); setSuccess(true); } }}><ArrowUpRight />Перейти к оплате</Button> : <Button className="h-12 w-full rounded-2xl" onClick={() => setSeconds(1200)}><RefreshCw />Обновить ссылку</Button>}
      </>}
    </SheetContent>
  </Sheet>;
}