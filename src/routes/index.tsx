import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CalendarDays, Check, Headphones, Settings, ShieldCheck, Zap } from "lucide-react";
import { AppShell, Logo, Row } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Лазейка — Telegram без лишних сложностей" },
      { name: "description", content: "Стабильный доступ к Telegram в одно нажатие, без VPN и настроек." },
      { property: "og:title", content: "Лазейка — Telegram без лишних сложностей" },
      { property: "og:description", content: "Стабильный доступ к Telegram в одно нажатие, без VPN и настроек." },
    ],
  }),
  component: Index,
});

function Index() {
  const [connected, setConnected] = useState(false);
  return (
    <AppShell>
      <div className="flex justify-end">
        <button aria-label="Настройки" className="rounded-full bg-card p-2 text-muted-foreground shadow-soft">
          <Settings className="h-5 w-5" />
        </button>
      </div>
      <Logo />
      <button
        onClick={() => setConnected(true)}
        className="mt-8 flex items-center justify-center gap-3 rounded-2xl bg-gradient-primary py-4 text-lg font-semibold text-primary-foreground shadow-button transition active:scale-[0.98]"
      >
        {connected ? <>Подключено <Check className="h-5 w-5" /></> : <>Подключить <ArrowRight className="h-5 w-5" /></>}
      </button>

      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-success-soft p-4">
        <span className="rounded-xl bg-success p-2 text-primary-foreground"><ShieldCheck className="h-6 w-6" /></span>
        <div className="flex-1">
          <p className="font-semibold">Доступ активен</p>
          <p className="text-xs text-muted-foreground">Telegram работает стабильно</p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-border rounded-2xl bg-card shadow-soft">
        <Link to="/access" className="block p-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span className="flex-1 font-semibold">Мой доступ</span>
            <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">Активен</span>
          </div>
          <p className="mt-3 text-sm font-semibold">Осталось 28 дней</p>
          <div className="mt-2 h-2 rounded-full bg-sky"><div className="h-2 w-3/5 rounded-full bg-gradient-primary" /></div>
          <p className="mt-2 text-xs text-muted-foreground">Действует до 12 ноября 2026</p>
        </Link>
        <Row icon={<Zap className="h-5 w-5" />} title="Автоматическое восстановление" sub="В случае блокировок" />
        <Row icon={<Settings className="h-5 w-5" />} title="Настройки" sub="Язык, уведомления и другое" />
      </div>

      <Link to="/help" className="mt-4 flex items-center gap-4 rounded-2xl bg-sky p-4">
        <Headphones className="h-7 w-7 text-primary" />
        <div className="flex-1">
          <p className="font-semibold">Помощь и поддержка</p>
          <p className="text-xs text-muted-foreground">Ответим на любые вопросы</p>
        </div>
        <span className="text-muted-foreground">›</span>
      </Link>
    </AppShell>
  );
}
