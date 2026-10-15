import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, ChevronRight, Sparkle } from "lucide-react";
import { AppShell, IconImg, Logo, Row } from "@/components/AppShell";
import shield from "@/assets/icon-shield.jpg";
import calendar from "@/assets/icon-calendar.png";
import bolt from "@/assets/icon-bolt.png";
import gear from "@/assets/icon-gear.png";
import headset from "@/assets/icon-headset.png";

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
        <button aria-label="Настройки" className="rounded-full bg-card p-2 shadow-soft">
          <IconImg src={gear} className="h-6 w-6" />
        </button>
      </div>
      <Logo />
      <button
        onClick={() => setConnected(true)}
        className="relative mt-7 flex items-center justify-center rounded-2xl bg-gradient-primary py-4 text-lg font-semibold text-primary-foreground shadow-button transition active:scale-[0.98]"
      >
        {connected ? "Подключено" : "Подключить"}
        <span className="absolute right-5">
          {connected ? <Check className="h-6 w-6" /> : <ArrowRight className="h-6 w-6" />}
        </span>
      </button>

      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-success p-4 shadow-soft">
        <img src={shield} alt="" width={256} height={256} className="h-12 w-12 rounded-xl" />
        <div className="flex-1">
          <p className="font-bold">Доступ активен</p>
          <p className="text-xs text-muted-foreground">Telegram работает стабильно</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="mt-4 divide-y divide-border rounded-2xl bg-card shadow-soft">
        <Link to="/access" className="block p-4">
          <div className="flex items-center gap-3">
            <IconImg src={calendar} className="h-8 w-8" />
            <span className="flex-1 font-bold">Мой доступ</span>
            <span className="flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
              <Sparkle className="h-3 w-3" fill="currentColor" /> Активен
            </span>
          </div>
          <p className="mt-3 pl-11 text-sm font-bold">Осталось 28 дней</p>
          <div className="ml-11 mt-2 h-2 rounded-full bg-sky"><div className="h-2 w-3/5 rounded-full bg-gradient-primary" /></div>
          <div className="mt-2 flex items-center pl-11">
            <p className="flex-1 text-xs text-muted-foreground">Действует до 12 ноября 2026</p>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
        <Row icon={bolt} title="Автоматическое восстановление" sub="В случае блокировок" />
        <Row icon={gear} title="Настройки" sub="Язык, уведомления и другое" />
      </div>

      <Link to="/help" className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-help p-4 shadow-soft">
        <IconImg src={headset} className="h-10 w-10" />
        <div className="flex-1">
          <p className="font-bold">Помощь и поддержка</p>
          <p className="text-xs text-muted-foreground">Ответим на любые вопросы</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
    </AppShell>
  );
}
