import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, ChevronRight, Sparkle } from "lucide-react";
import { AppShell, IconImg, Logo } from "@/components/AppShell";
import { ConnectionGuide } from "@/components/ConnectionGuide";
import { Button } from "@/components/ui/button";
import shield from "@/assets/icon-shield.jpg";
import calendar from "@/assets/icon-calendar.png";
import bolt from "@/assets/icon-bolt.png";
import headset from "@/assets/icon-headset.png";

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
  const [guideOpen, setGuideOpen] = useState(false);
  return (
    <AppShell>
      <Logo />

      <Button onClick={() => setGuideOpen(true)} className="relative mt-7 h-auto rounded-2xl bg-gradient-primary py-4 text-lg font-semibold text-primary-foreground shadow-button">
        Подключить
        <ArrowRight className="absolute right-5 h-6 w-6" />
      </Button>
      <ConnectionGuide key={guideOpen ? "expanded" : "collapsed"} expanded={guideOpen} />

      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-gradient-success p-4 shadow-soft">
        <img src={shield} alt="" width={256} height={256} className="h-12 w-12 rounded-xl" />
        <div className="flex-1">
          <p className="font-bold">Доступ активен</p>
          <p className="text-xs text-muted-foreground">Telegram работает стабильно</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>

      <p className="mt-3 flex items-center gap-2 px-1 text-xs text-muted-foreground">
        <IconImg src={bolt} className="h-4 w-4" />
        Автоматическое восстановление: при блокировках переключим сами
      </p>

      <Link to="/access" className="mt-4 block rounded-2xl bg-card p-4 shadow-soft">
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
