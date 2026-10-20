import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AdminConfirm, type PendingAction } from "@/components/admin/AdminConfirm";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { property: "og:description", content: "Панель управления пользователями, подписками и экономикой Лазейки." },
      { property: "og:title", content: "Админка — Лазейка" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },

      { title: "Админка — Лазейка" },
      { name: "description", content: "Панель управления пользователями, подписками и экономикой Лазейки." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

// ── API helpers ──────────────────────────────────────────────────────────────
async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data;
}

interface Economics {
  users: { total: number; activeSubs: number; expiredSubs: number };
  revenue: { totalRub: number; last30dRub: number; paymentsPaid: number };
  byPlan: Array<{ planId: string; count: number; revenueRub: number }>;
}
interface UserRow {
  id: string;
  telegramUserId: number;
  username: string | null;
  firstName: string | null;
  status: string;
  planId: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

const rub = (n: number) => n.toLocaleString("ru-RU") + " ₽";
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString("ru-RU") : "—");

// ── Small UI atoms ───────────────────────────────────────────────────────────
function Card({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}
function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-extrabold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

// ── Login ────────────────────────────────────────────────────────────────────
function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/api/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        <div className="mb-6 text-xl font-extrabold">Лазейка · админ</div>
        <label className="block text-xs font-semibold text-muted-foreground">
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="mt-3 block text-xs font-semibold text-muted-foreground">
          Пароль
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
        </label>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? "Вход…" : "Войти"}
        </button>
      </form>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ role, onLogout }: { role: string; onLogout: () => void }) {
  const [eco, setEco] = useState<Economics | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState("");
  const [pending, setPending] = useState<PendingAction>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadEco = useCallback(async () => {
    try {
      setEco(await api<Economics>("/api/admin/metrics"));
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  }, []);
  const loadUsers = useCallback(async (query: string) => {
    try {
      const r = await api<{ users: UserRow[] }>(`/api/admin/users?q=${encodeURIComponent(query)}`);
      setUsers(r.users);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  }, []);

  useEffect(() => {
    void loadEco();
    void loadUsers("");
  }, [loadEco, loadUsers]);

  const canOperate = role === "operator" || role === "admin";

  const grantDaysPrompt = (u: UserRow) => {
    const input = window.prompt(`Сколько дней начислить ${u.username ?? u.telegramUserId}?`, "30");
    if (input === null) return;
    const days = Number(input);
    if (!Number.isFinite(days) || days <= 0) { setToast("Некорректное число дней"); return; }
    act(u, "grant", `Начислить ${days} дн. ${u.username ?? u.telegramUserId}`, { days });
  };

  const act = (u: UserRow, action: string, title: string, extra?: Record<string, unknown>) => {
    setPending({
      title,
      onDone: async (reason) => {
        try {
          await api(`/api/admin/users/${u.id}`, {
            method: "POST",
            body: JSON.stringify({ action, reason, ...extra }),
          });
          setToast("Готово");
          await loadUsers(q);
          await loadEco();
        } catch (e) {
          setToast(e instanceof Error ? e.message : "Ошибка");
        }
      },
    });
  };

  const logout = async () => {
    await api("/api/admin/logout", { method: "POST" }).catch(() => {});
    onLogout();
  };

  return (
    <div className="min-h-screen bg-background p-6 text-foreground md:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Лазейка · админ</h1>
          <p className="text-sm text-muted-foreground">Роль: {role}</p>
        </div>
        <button onClick={logout} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">Выйти</button>
      </header>

      {/* Economics */}
      <section className="mb-6">
        <h2 className="mb-3 text-lg font-bold">Экономика</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Пользователей" value={String(eco?.users.total ?? "—")} />
          <Stat label="Активных подписок" value={String(eco?.users.activeSubs ?? "—")} sub={`истекло: ${eco?.users.expiredSubs ?? "—"}`} />
          <Stat label="Выручка за 30 дней" value={eco ? rub(eco.revenue.last30dRub) : "—"} sub={`оплат: ${eco?.revenue.paymentsPaid ?? "—"}`} />
          <Stat label="Выручка всего" value={eco ? rub(eco.revenue.totalRub) : "—"} />
        </div>
        {eco && eco.byPlan.length > 0 && (
          <div className="mt-3">
            <Card title="По тарифам">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2">Тариф</th><th className="pb-2">Оплат</th><th className="pb-2">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {eco.byPlan.map((p) => (
                    <tr key={p.planId} className="border-t border-border">
                      <td className="py-2 font-semibold">{p.planId}</td>
                      <td className="py-2">{p.count}</td>
                      <td className="py-2">{rub(p.revenueRub)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </section>

      {/* Users */}
      <section>
        <h2 className="mb-3 text-lg font-bold">Пользователи</h2>
        <Card
          title="Поиск"
          right={
            <form
              onSubmit={(e) => { e.preventDefault(); void loadUsers(q); }}
              className="flex gap-2"
            >
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="@username, имя или ID" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
              <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Найти</button>
            </form>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="pb-2">Пользователь</th><th className="pb-2">TG ID</th><th className="pb-2">Статус</th>
                  <th className="pb-2">Тариф</th><th className="pb-2">Доступ до</th><th className="pb-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Нет данных</td></tr>
                )}
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-border align-middle">
                    <td className="py-2">{u.username ? `@${u.username}` : u.firstName ?? "—"}</td>
                    <td className="py-2 text-muted-foreground">{u.telegramUserId}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.status === "active" ? "bg-primary/15 text-primary" : u.status === "canceled" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
                    </td>
                    <td className="py-2">{u.planId ?? "—"}</td>
                    <td className="py-2">{fmtDate(u.currentPeriodEnd)}</td>
                    <td className="py-2">
                      {canOperate ? (
                        <div className="flex flex-wrap gap-1.5">
                          <MiniBtn onClick={() => grantDaysPrompt(u)}>Начислить дни</MiniBtn>
                          <MiniBtn onClick={() => act(u, "rotate", `Перевыпустить ссылку ${u.username ?? u.telegramUserId}`)}>Перевыпуск</MiniBtn>
                          {u.status === "canceled"
                            ? <MiniBtn onClick={() => act(u, "resume", `Разблокировать ${u.username ?? u.telegramUserId}`)}>Разблок.</MiniBtn>
                            : <MiniBtn danger onClick={() => act(u, "suspend", `Заблокировать ${u.username ?? u.telegramUserId}`)}>Блок</MiniBtn>}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">только просмотр</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <DomainsSection role={role} setPending={setPending} setToast={setToast} />

      {toast && (
        <div onClick={() => setToast(null)} className="fixed bottom-4 right-4 cursor-pointer rounded-lg bg-foreground px-4 py-2 text-sm text-background shadow-lg">{toast}</div>
      )}
      <AdminConfirm action={pending} onClose={() => setPending(null)} onLog={() => {}} />
    </div>
  );
}

// ── Mask domains ─────────────────────────────────────────────────────────────
interface DomainRow {
  id: string;
  domain: string;
  status: string;
  lastCheckAt: string | null;
  lastOk: boolean | null;
  lastError: string | null;
  failCount: number;
  assigned: number;
}

function DomainsSection({
  role,
  setPending,
  setToast,
}: {
  role: string;
  setPending: (p: PendingAction) => void;
  setToast: (s: string | null) => void;
}) {
  const [rows, setRows] = useState<DomainRow[]>([]);
  const [def, setDef] = useState<string>("");
  const [input, setInput] = useState("");
  const isAdmin = role === "admin";
  const canCheck = role === "operator" || role === "admin";

  const load = useCallback(async () => {
    try {
      const r = await api<{ domains: DomainRow[]; defaultDomain: string }>("/api/admin/domains");
      setRows(r.domains);
      setDef(r.defaultDomain);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Ошибка загрузки");
    }
  }, [setToast]);
  useEffect(() => { void load(); }, [load]);

  const restartNote = (r: { restartRequired?: boolean }) =>
    r.restartRequired ? "Готово. Перезапустите telemt, чтобы он принял список доменов." : "Готово";

  const add = () => {
    const domain = input.trim();
    if (!domain) return;
    setPending({
      title: `Добавить домен ${domain}`,
      onDone: async (reason) => {
        try {
          const r = await api<{ restartRequired: boolean }>("/api/admin/domains", { method: "POST", body: JSON.stringify({ domain, reason }) });
          setInput("");
          setToast(restartNote(r));
          await load();
        } catch (e) {
          setToast(e instanceof Error ? e.message : "Ошибка");
        }
      },
    });
  };

  const toggle = (d: DomainRow) => {
    const action = d.status === "active" ? "disable" : "enable";
    setPending({
      title: action === "disable" ? `Выключить ${d.domain} и перевыпустить ссылки (${d.assigned})` : `Включить ${d.domain}`,
      onDone: async (reason) => {
        try {
          const r = await api<{ restartRequired?: boolean }>(`/api/admin/domains/${d.id}`, { method: "POST", body: JSON.stringify({ action, reason }) });
          setToast(restartNote(r));
          await load();
        } catch (e) {
          setToast(e instanceof Error ? e.message : "Ошибка");
        }
      },
    });
  };

  const check = async (d: DomainRow) => {
    try {
      const r = await api<{ result: { ok: boolean; error?: string; disabled: boolean } }>(`/api/admin/domains/${d.id}`, { method: "POST", body: JSON.stringify({ action: "check" }) });
      setToast(r.result.ok ? `${d.domain}: работает` : `${d.domain}: ${r.result.error ?? "ошибка"}${r.result.disabled ? " — выключен" : ""}`);
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Ошибка");
    }
  };

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-bold">Домены маскировки</h2>
      <Card
        title={`По умолчанию: ${def || "—"}`}
        right={
          isAdmin ? (
            <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="example.com" className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm" />
              <button className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground">Добавить</button>
            </form>
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2">Домен</th><th className="pb-2">Статус</th><th className="pb-2">Проверка</th>
                <th className="pb-2">Пользователей</th><th className="pb-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Нет данных</td></tr>
              )}
              {rows.map((d) => (
                <tr key={d.id} className="border-t border-border align-middle">
                  <td className="py-2 font-semibold">{d.domain}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${d.status === "active" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                      {d.status === "active" ? "работает" : "выключен"}
                    </span>
                  </td>
                  <td className="py-2 text-xs">
                    {d.lastCheckAt ? (
                      <span className={d.lastOk ? "text-muted-foreground" : "text-destructive"}>
                        {d.lastOk ? "OK" : `${d.lastError ?? "ошибка"} (${d.failCount})`} · {new Date(d.lastCheckAt).toLocaleString("ru-RU")}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-2">{d.assigned}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1.5">
                      {canCheck && <MiniBtn onClick={() => void check(d)}>Проверить</MiniBtn>}
                      {isAdmin && (
                        <MiniBtn danger={d.status === "active"} onClick={() => toggle(d)}>
                          {d.status === "active" ? "Выключить" : "Включить"}
                        </MiniBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

function MiniBtn({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`rounded-md px-2 py-1 text-xs font-semibold ${danger ? "border border-destructive text-destructive" : "border border-border hover:bg-muted"}`}>
      {children}
    </button>
  );
}

// ── Page (auth gate) ─────────────────────────────────────────────────────────
function AdminPage() {
  const [state, setState] = useState<{ ready: boolean; role: string | null }>({ ready: false, role: null });

  const check = useCallback(async () => {
    try {
      const me = await api<{ role: string }>("/api/admin/me");
      setState({ ready: true, role: me.role });
    } catch {
      setState({ ready: true, role: null });
    }
  }, []);

  useEffect(() => { void check(); }, [check]);

  if (!state.ready) return <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">Загрузка…</div>;
  if (!state.role) return <Login onSuccess={check} />;
  return <Dashboard role={state.role} onLogout={() => setState({ ready: true, role: null })} />;
}
