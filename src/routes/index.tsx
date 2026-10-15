import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { AppShell, IconImg, Logo } from "@/components/AppShell";
import { ConnectionGuide } from "@/components/ConnectionGuide";
import { AccessStatus } from "@/components/AccessStatus";
import { useDemo } from "@/components/DemoProvider";
import { Button } from "@/components/ui/button";
import headset from "@/assets/icon-headset.png";
import gift from "@/assets/icon-gift.png";
import { HomeBenefits } from "@/components/HomeBenefits";
import { PaymentSheet } from "@/components/PaymentSheet";
import { DEMO_PLANS, type DemoPlan } from "@/lib/demo-access";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Лазейка — Telegram без лишних сложностей" },
      { name: "description", content: "Стабильный доступ к Telegram в одно нажатие, без VPN и настроек." },
      { property: "og:title", content: "Лазейка — Telegram без лишних сложностей" },
      { property: "og:description", content: "Стабильный доступ к Telegram в одно нажатие, без VPN и настроек." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const { days } = useDemo();
  const [guideOpen, setGuideOpen] = useState(false);
  const [payment, setPayment] = useState<DemoPlan | null>(null);
  return <AppShell>
    <Logo />
    <AccessStatus />
    {days ? <><Button onClick={() => setGuideOpen(true)} className="mt-4 h-14 rounded-2xl bg-gradient-primary text-base font-bold shadow-button">Подключить Telegram<ArrowRight /></Button><Button asChild variant="link" className="mt-1"><Link to="/access">Продлить доступ</Link></Button></> : <Button asChild className="mt-4 h-14 rounded-2xl bg-gradient-primary text-base font-bold shadow-button"><Link to="/access">Оплатить доступ<ArrowRight /></Link></Button>}
    <ConnectionGuide key={guideOpen ? 'open' : 'closed'} expanded={guideOpen} />
    <section className="mt-5" aria-label="Тарифы">
      <div className="mb-3 flex items-baseline justify-between"><h2 className="text-xl font-extrabold">Ваш доступ</h2><span className="text-xs text-muted-foreground">Три тарифа</span></div>
      <div className="grid grid-cols-3 gap-2">
        {DEMO_PLANS.map(plan => <Button key={plan.id} variant="ghost" onClick={() => setPayment(plan)} aria-label={`Оплатить ${plan.name} за ${plan.price} ₽`} className={`relative h-auto min-w-0 flex-col gap-1 whitespace-normal rounded-2xl border px-2 pb-4 pt-5 shadow-soft ${plan.id === 'quarter' ? 'border-primary/40 bg-gradient-primary text-primary-foreground' : 'border-card bg-card'}`}>
          <span className="text-xs font-semibold">{plan.name}</span>
          <strong className="mt-1 text-lg font-extrabold">{plan.price.toLocaleString('ru-RU')} ₽</strong>
          <span className={`text-[10px] font-normal ${plan.id === 'quarter' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{plan.id === 'quarter' ? 'Выгодный выбор' : plan.id === 'year' ? 'На целый год' : 'Попробовать'}</span>
        </Button>)}
      </div>
    </section>
    <HomeBenefits />
    <Button asChild variant="ghost" className="mt-5 h-auto justify-start whitespace-normal rounded-2xl bg-gradient-help p-4 shadow-soft"><Link to="/referrals"><IconImg src={gift} className="h-12 w-12" /><span className="flex-1 text-left"><span className="block font-bold">Пригласить друзей</span><span className="mt-1 block text-xs font-normal text-muted-foreground">+30 дней за каждого друга</span></span><ChevronRight /></Link></Button>
    <Button asChild variant="ghost" className="mt-3 h-auto justify-start rounded-2xl bg-card p-4 shadow-soft"><Link to="/help"><IconImg src={headset} className="h-10 w-10" /><span className="flex-1 text-left font-bold">Помощь и поддержка</span><ChevronRight /></Link></Button>
    <p className="mt-5 text-center text-xs text-muted-foreground">Тестовый аккаунт Telegram · без списаний</p>
    <PaymentSheet plan={payment} onClose={() => setPayment(null)} />
  </AppShell>;
}
