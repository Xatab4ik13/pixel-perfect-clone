import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { AppShell, Logo } from "@/components/AppShell";
import { AccessStatus } from "@/components/AccessStatus";
import { PaymentSheet } from "@/components/PaymentSheet";
import { useDemo } from "@/components/DemoProvider";
import { Button } from "@/components/ui/button";
import { DEMO_PLANS, type DemoPlan } from "@/lib/demo-access";

export const Route = createFileRoute("/access")({
  head: () => ({
    meta: [
      { title: "Мой доступ — Лазейка" },
      { name: "description", content: "Срок действия и продление доступа к Лазейке." },
      { property: "og:title", content: "Мой доступ — Лазейка" },
      { property: "og:description", content: "Срок действия и продление доступа к Лазейке." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Access,
});

function Access() {
  const { days } = useDemo();
  const [selected, setSelected] = useState<DemoPlan>(DEMO_PLANS[0]);
  const [payment, setPayment] = useState<DemoPlan | null>(null);
  return <AppShell><Logo small /><AccessStatus />
    <h2 className="mt-7 text-xl font-extrabold">{days ? 'Продлить доступ' : 'Выберите тариф'}</h2>
    <div className="mt-4 space-y-3">{DEMO_PLANS.map(plan => <Button variant="ghost" key={plan.id} aria-pressed={selected.id === plan.id} onClick={() => setSelected(plan)} className={`h-auto w-full justify-start rounded-2xl border p-4 ${selected.id === plan.id ? 'border-primary bg-sky' : 'border-border bg-card'}`}><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected.id === plan.id ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`}>{selected.id === plan.id && <Check />}</span><span className="flex-1 text-left"><span className="block font-bold">{plan.name}</span><span className="block text-xs font-normal text-muted-foreground">{plan.id === 'quarter' ? 'Выгодный выбор' : plan.id === 'year' ? 'Максимум выгоды' : 'Начать с малого'}</span></span><span className="text-lg font-extrabold text-primary">{plan.price.toLocaleString('ru-RU')} ₽</span></Button>)}</div>
    <Button className="mt-5 h-14 rounded-2xl bg-gradient-primary text-base font-bold shadow-button" onClick={() => setPayment(selected)}>Оплатить {selected.price.toLocaleString('ru-RU')} ₽<ArrowRight /></Button>
    <p className="mt-3 text-center text-xs text-muted-foreground">Оплата через СБП · Райффайзенбанк</p>
    <PaymentSheet plan={payment} onClose={() => setPayment(null)} />
  </AppShell>;
}
