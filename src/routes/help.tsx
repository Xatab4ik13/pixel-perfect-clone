import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Search, Send } from "lucide-react";
import { AppShell, IconImg, Logo } from "@/components/AppShell";
import headset from "@/assets/icon-headset.png";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Помощь — Лазейка" },
      { name: "description", content: "Ответы на частые вопросы о подключении Лазейки." },
      { property: "og:title", content: "Помощь — Лазейка" },
      { property: "og:description", content: "Ответы на частые вопросы о подключении Лазейки." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Help,
});

const faq = [
  ["Нужны ли отдельные приложения?", "Нет. Подключение настраивается в одно нажатие."],
  ["Как подключиться?", "Оплатите доступ на главной, затем нажмите «Подключить» — ссылка откроется прямо в приложении."],
  ["Что если перестанет работать?", "Система сама переключится на резервный сервер — делать ничего не нужно."],
  ["На каких устройствах работает?", "iPhone, Android и компьютер."],
];

function Help() {
  const [q, setQ] = useState("");
  const list = faq.filter(([a, b]) => (a + " " + b).toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <AppShell>
      <Logo small />

      <div className="mt-8 flex items-center gap-4 rounded-2xl bg-gradient-help p-5 shadow-soft">
        <IconImg src={headset} className="h-14 w-14" />
        <div>
          <p className="text-lg font-bold">Мы на связи</p>
          <p className="text-xs text-muted-foreground">Обычно отвечаем в течение 15 минут</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold">Частые вопросы</h2>
      <label className="mt-3 flex h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4 shadow-soft">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по вопросам" aria-label="Поиск по вопросам" className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
      </label>
      <div className="mt-3 space-y-3">
        {list.length === 0 && <p className="rounded-2xl bg-card p-4 text-sm text-muted-foreground shadow-soft">Ничего не нашли — напишите нам, поможем.</p>}
        {list.map(([q, a]) => (
          <details key={q} className="group rounded-2xl bg-card p-4 shadow-soft">
            <summary className="flex cursor-pointer list-none items-center gap-3 font-semibold [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{q}</span>
              <ChevronDown className="h-5 w-5 text-muted-foreground transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>

      <button className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-4 font-semibold text-primary-foreground shadow-button transition active:scale-[0.98]">
        Написать в поддержку
        <Send className="h-5 w-5" />
      </button>
    </AppShell>
  );
}
