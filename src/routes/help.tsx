import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Logo } from "@/components/AppShell";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Помощь — Лазейка" },
      { name: "description", content: "Ответы на частые вопросы о подключении Лазейки." },
      { property: "og:title", content: "Помощь — Лазейка" },
      { property: "og:description", content: "Ответы на частые вопросы о подключении Лазейки." },
    ],
  }),
  component: Help,
});

const faq = [
  ["Нужен ли VPN?", "Нет. Подключение работает внутри официального Telegram."],
  ["Как подключиться?", "Нажмите «Подключить» и подтвердите окно Telegram."],
  ["Что если перестанет работать?", "Система сама переключится на резервный сервер — делать ничего не нужно."],
  ["На каких устройствах работает?", "iPhone, Android и Telegram Desktop."],
];

function Help() {
  return (
    <AppShell>
      <Logo small />
      <div className="mt-8 space-y-3">
        {faq.map(([q, a]) => (
          <details key={q} className="rounded-2xl bg-card p-4 shadow-soft">
            <summary className="cursor-pointer font-semibold">{q}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <button className="mt-6 rounded-2xl bg-gradient-primary py-4 font-semibold text-primary-foreground shadow-button">
        Написать в поддержку
      </button>
    </AppShell>
  );
}
