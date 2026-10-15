import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Logo } from "@/components/AppShell";

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
  { name: "1 месяц", price: "199 ₽" },
  { name: "3 месяца", price: "499 ₽" },
  { name: "12 месяцев", price: "1 690 ₽" },
];

function Access() {
  return (
    <AppShell>
      <Logo small />
      <div className="mt-8 rounded-2xl bg-card p-5 shadow-soft">
        <p className="text-sm text-muted-foreground">Текущий доступ</p>
        <p className="mt-1 text-2xl font-extrabold">Осталось 28 дней</p>
        <div className="mt-3 h-2 rounded-full bg-sky"><div className="h-2 w-3/5 rounded-full bg-gradient-primary" /></div>
        <p className="mt-2 text-xs text-muted-foreground">Действует до 12 ноября 2026</p>
      </div>
      <h2 className="mt-8 text-lg font-bold">Продлить</h2>
      <div className="mt-3 space-y-3">
        {plans.map((p) => (
          <button key={p.name} className="flex w-full items-center justify-between rounded-2xl bg-card p-4 shadow-soft">
            <span className="font-semibold">{p.name}</span>
            <span className="font-bold text-primary">{p.price}</span>
          </button>
        ))}
      </div>
    </AppShell>
  );
}
