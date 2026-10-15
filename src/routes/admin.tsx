import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { AdminConfirm, type PendingAction } from "@/components/admin/AdminConfirm";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Админка — Лазейка" },
      { name: "description", content: "Панель управления пользователями, тарифами, серверами и доменами Лазейки." },
      { property: "og:title", content: "Админка — Лазейка" },
      { property: "og:description", content: "Панель управления сервисом Лазейка." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const SECTIONS = ["Пользователи", "Подписки и тарифы", "Серверы", "Домены маскировки", "Автоматика", "Рассылки", "Настройки"] as const;
type Section = typeof SECTIONS[number];
type Ask = (title: string, onDone?: () => void) => void;

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-border bg-card p-5"><h3 className="mb-3 font-bold">{title}</h3>{children}</section>;
}
function Empty() { return <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">Нет данных</div>; }
function Field({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block text-xs font-semibold text-muted-foreground">{label}<input {...p} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground" /></label>;
}
function Btn({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`rounded-lg px-3 py-2 text-sm font-semibold ${danger ? "border border-destructive text-destructive" : "bg-primary text-primary-foreground"}`}>{children}</button>;
}

function Users({ ask }: { ask: Ask }) {
  const [q, setQ] = useState(""); const [searched, setSearched] = useState(false);
  return <div className="space-y-4">
    <Card title="Поиск пользователя">
      <div className="flex gap-2"><div className="flex-1"><Field label="@username или Telegram ID" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="self-end"><Btn onClick={() => setSearched(true)}>Найти</Btn></div></div>
      <p className="mt-2 text-xs text-muted-foreground">Ссылка пользователя показывается только в его карточке по кнопке «Показать».</p>
    </Card>
    <Card title="Карточка пользователя">{searched ? <Empty /> : <p className="text-sm text-muted-foreground">Найдите пользователя, чтобы открыть карточку.</p>}</Card>
    <Card title="Действия (станут доступны в карточке)">
      <div className="flex flex-wrap gap-2 opacity-50 pointer-events-none">
        {["Выдать доступ вручную", "Продлить на N дней", "Перевыпустить ссылку", "Показать ссылку", "Отозвать доступ", "Заблокировать / разблокировать", "Написать через бота"].map(a => <Btn key={a} onClick={() => ask(a)}>{a}</Btn>)}
      </div>
    </Card>
  </div>;
}

function Plans({ ask }: { ask: Ask }) {
  const [f, setF] = useState({ name: "", price: "", days: "" });
  const [promo, setPromo] = useState({ code: "", days: "" });
  return <div className="grid gap-4 lg:grid-cols-2">
    <Card title="Создать тариф">
      <div className="grid grid-cols-3 gap-2"><Field label="Название" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /><Field label="Цена, ₽" type="number" value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /><Field label="Срок, дней" type="number" value={f.days} onChange={e => setF({ ...f, days: e.target.value })} /></div>
      <div className="mt-3"><Btn onClick={() => ask(`Создать тариф «${f.name || "без названия"}»`)}>Создать</Btn></div>
    </Card>
    <Card title="Промокод / бесплатные дни">
      <div className="grid grid-cols-2 gap-2"><Field label="Промокод" value={promo.code} onChange={e => setPromo({ ...promo, code: e.target.value })} /><Field label="Дней" type="number" value={promo.days} onChange={e => setPromo({ ...promo, days: e.target.value })} /></div>
      <div className="mt-3"><Btn onClick={() => ask(`Выдать промокод «${promo.code || "—"}» на ${promo.days || 0} дн.`)}>Выдать</Btn></div>
    </Card>
    <Card title="Тарифы (изменить / выключить)"><Empty /></Card>
    <Card title="Платежи и возвраты"><Empty /></Card>
  </div>;
}

function Servers({ ask }: { ask: Ask }) {
  const [f, setF] = useState({ name: "", ip: "", country: "", provider: "" });
  return <div className="space-y-4">
    <Card title="Добавить сервер">
      <div className="grid grid-cols-4 gap-2">{(["name", "ip", "country", "provider"] as const).map((k, i) => <Field key={k} label={["Имя", "IP", "Страна", "Провайдер"][i] ?? k} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} />)}</div>
      <div className="mt-3"><Btn onClick={() => ask(`Добавить сервер «${f.name || "—"}» (${f.ip || "—"})`)}>Добавить</Btn></div>
    </Card>
    <Card title="Серверы (основной · перезапуск · вывести из работы · удалить)"><Empty /></Card>
  </div>;
}

function Domains({ ask }: { ask: Ask }) {
  const [d, setD] = useState("");
  return <div className="space-y-4">
    <Card title="Добавить домен">
      <div className="flex gap-2"><div className="flex-1"><Field label="Домен" placeholder="docs.rs" value={d} onChange={e => setD(e.target.value)} /></div><div className="self-end"><Btn onClick={() => ask(`Добавить домен «${d || "—"}»`)}>Добавить</Btn></div></div>
    </Card>
    <Card title="Домены (для новых пользователей · заблокирован → перевыпуск ссылок, бот разошлёт сам)"><Empty /></Card>
  </div>;
}

function Automation({ ask }: { ask: Ask }) {
  const [on, setOn] = useState(true); const [chat, setChat] = useState("");
  return <div className="grid gap-4 lg:grid-cols-2">
    <Card title="Агент-восстановитель">
      <div className="flex items-center justify-between"><span className="text-sm">Автоматика {on ? "включена" : "выключена"}</span>
        <button role="switch" aria-checked={on} onClick={() => ask(on ? "Выключить автоматику" : "Включить автоматику", () => setOn(!on))} className={`h-7 w-12 rounded-full p-1 transition ${on ? "bg-primary" : "bg-muted"}`}><span className={`block h-5 w-5 rounded-full bg-card transition ${on ? "translate-x-5" : ""}`} /></button></div>
    </Card>
    <Card title="Уведомления">
      <Field label="Ваш Telegram-чат (ID или @username)" value={chat} onChange={e => setChat(e.target.value)} />
      <div className="mt-3"><Btn onClick={() => ask(`Присылать уведомления в «${chat || "—"}»`)}>Сохранить</Btn></div>
    </Card>
    <div className="lg:col-span-2"><Card title="Инциденты (взять на себя · вернуть автоматике)"><Empty /></Card></div>
  </div>;
}

function Broadcasts({ ask }: { ask: Ask }) {
  const [group, setGroup] = useState("Все"); const [text, setText] = useState("");
  return <Card title="Новая рассылка">
    <label className="block text-xs font-semibold text-muted-foreground">Кому
      <select value={group} onChange={e => setGroup(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
        <option>Все</option><option>С истекающей подпиской</option><option>На определённом домене</option></select></label>
    <label className="mt-3 block text-xs font-semibold text-muted-foreground">Текст
      <textarea rows={4} value={text} onChange={e => setText(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground" /></label>
    <div className="mt-3"><Btn onClick={() => ask(`Отправить рассылку: «${group}»`)}>Отправить</Btn></div>
  </Card>;
}

function Settings({ ask }: { ask: Ask }) {
  const [admin, setAdmin] = useState(""); const [role, setRole] = useState("Оператор"); const [token, setToken] = useState("");
  return <div className="grid gap-4 lg:grid-cols-2">
    <Card title="Админы">
      <div className="flex gap-2"><div className="flex-1"><Field label="@username" value={admin} onChange={e => setAdmin(e.target.value)} /></div>
        <select value={role} onChange={e => setRole(e.target.value)} className="self-end rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>Владелец</option><option>Оператор</option><option>Поддержка</option></select>
        <div className="self-end"><Btn onClick={() => ask(`Добавить админа «${admin || "—"}» с ролью «${role}»`)}>Добавить</Btn></div></div>
      <div className="mt-3"><Empty /></div>
    </Card>
    <Card title="Токен бота">
      <Field label="Новый токен" type="password" value={token} onChange={e => setToken(e.target.value)} />
      <div className="mt-3"><Btn onClick={() => ask("Заменить токен бота")}>Сохранить</Btn></div>
    </Card>
    <div className="lg:col-span-2"><Card title="Тексты кнопок и сообщений Mini App"><Empty /></Card></div>
  </div>;
}

function AdminPage() {
  const [section, setSection] = useState<Section>("Пользователи");
  const [pending, setPending] = useState<PendingAction>(null);
  const [log, setLog] = useState<string[]>([]);
  const ask: Ask = (title, onDone) => setPending({ title, onDone });
  const View = { "Пользователи": Users, "Подписки и тарифы": Plans, "Серверы": Servers, "Домены маскировки": Domains, "Автоматика": Automation, "Рассылки": Broadcasts, "Настройки": Settings }[section];
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-64 shrink-0 border-r border-border bg-card p-4">
        <div className="mb-6 px-2 text-xl font-extrabold">Лазейка · админ</div>
        <nav className="space-y-1">{SECTIONS.map((s, i) => (
          <button key={s} onClick={() => setSection(s)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${s === section ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"}`}>{i + 1}. {s}</button>
        ))}</nav>
      </aside>
      <main className="flex-1 p-8">
        <h1 className="mb-1 text-2xl font-bold">{section}</h1>
        <p className="mb-6 text-sm text-muted-foreground">Бэкенд пока не подключён — действия не выполняются, только записываются в журнал ниже.</p>
        <View ask={ask} />
        <div className="mt-6"><Card title="Журнал действий (эта сессия)">{log.length ? <ul className="space-y-1 text-sm">{log.map((l, i) => <li key={i}>{l}</li>)}</ul> : <Empty />}</Card></div>
      </main>
      <AdminConfirm action={pending} onClose={() => setPending(null)} onLog={t => setLog(v => [`${new Date().toLocaleTimeString("ru")} · ${t}`, ...v])} />
    </div>
  );
}
