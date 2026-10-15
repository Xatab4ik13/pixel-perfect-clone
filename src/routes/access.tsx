import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, Sparkle } from "lucide-react";
import { AppShell, IconImg, Logo } from "@/components/AppShell";
import calendar from "@/assets/icon-calendar.png";
import bolt from "@/assets/icon-bolt.png";

export const Route = createFileRoute("/access")({
  head: () => ({
    meta: [
      { title: "Мой доступ — Лазейка" },
      { name: "description", content: "Срок действия и продление доступа к Лазейке." },
      { property: "og:title", content: "Мой доступ — Лазейка" },
      { property: "og:description", content: "Срок действия и продление доступа к Лазейке." },
    ],
  }),
  component: Access,
});

const plans = [
  { name: "1 месяц", price: "199 ₽", note: "Попробовать" },
  { name: "3 месяца", price: "499 ₽", note: "Выгодно", best: true },
  { name: "12 месяцев", price: "1 690 ₽", note: "Максимум выгоды" },
];

function Access() {
  return (
    <AppShell>
      <Logo small />

      <div className="mt-8 rounded-2xl bg-gradient-success p-5 shadow-soft">
        <div className="flex items-center gap-4">
          <IconImg src={calendar} className="h-12 w-12" />
          <div className="flex-1">
            <span className="flex w-fit items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
              <Sparkle className="h-3 w-3" fill="currentColor" /> Активен
            </span>
            <p className="mt-1 text-2xl font-extrabold">Осталось 28 дней</p>
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-card/70"><div className="h-2 w-3/5 rounded-full bg-gradient-primary" /></div>
        <p className="mt-2 text-xs text-muted-foreground">Действует до 12 ноября 2026</p>
      </div>

      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
        <IconImg src={bolt} className="h-9 w-9" />
        <div className="flex-1">
          <p className="text-sm font-bold">Автоматическое восстановление</p>
          <p className="text-xs text-muted-foreground">В случае блокировок переключим сами</p>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>

      <h2 className="mt-8 text-lg font-bold">Продлить доступ</h2>
      <div className="mt-3 space-y-3">
        {plans.map((p) => (
          <button
            key={p.name}
            className={`flex w-full items-center gap-4 rounded-2xl p-4 shadow-soft transition active:scale-[0.98] ${
              p.best ? "bg-gradient-primary text-primary-foreground" : "bg-card"
            }`}
          >
            <span className="flex-1 text-left">
              <span className="block font-bold">{p.name}</span>
              <span className={`block text-xs ${p.best ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{p.note}</span>
            </span>
            <span className={`text-lg font-extrabold ${p.best ? "" : "text-primary"}`}>{p.price}</span>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
