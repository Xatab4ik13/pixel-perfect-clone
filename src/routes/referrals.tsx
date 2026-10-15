import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Share2, LogOut } from "lucide-react";
import { AppShell, IconImg, Logo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/SessionProvider";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { REFERRAL_DAYS, nextRewardMonth, rewardDays } from "@/lib/referral-rules";
import gift from "@/assets/icon-gift.png";

export const Route = createFileRoute("/referrals")({
  validateSearch: (search: Record<string, unknown>): { ref?: string } => {
    const ref = search['ref'];
    return typeof ref === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref) ? { ref } : {};
  },
  head: () => ({ meta: [
    { title: "Пригласить друзей — Лазейка" },
    { name: "description", content: "30 дней доступа на следующий месяц за каждого приглашённого друга." },
    { property: "og:title", content: "Пригласить друзей — Лазейка" },
    { property: "og:description", content: "30 дней доступа на следующий месяц за каждого приглашённого друга." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Referrals,
});

function Referrals() {
  const { user, ready } = useSession();
  const { ref } = Route.useSearch();
  const [link, setLink] = useState("");
  const [stats, setStats] = useState<{ friends: number; pending: number; available: number } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!user) { setLink(""); setStats(null); return; }
    let active = true;
    async function load() {
      const { data: code, error } = await supabase.rpc("ensure_referral_account");
      if (error || !code) { if (active) setMessage("Не удалось загрузить приглашения. Попробуйте ещё раз."); return; }
      const { data: rewards, error: rewardsError } = await supabase.from("referral_rewards").select("available_from, days");
      if (!active) return;
      if (rewardsError) { setMessage("Не удалось загрузить бонусы. Попробуйте ещё раз."); return; }
      setLink(`${window.location.origin}/referrals?ref=${code}`);
      const today = new Date().toISOString().slice(0, 10);
      const rows = rewards ?? [];
      setStats({ friends: rows.length, pending: rewardDays(rows.filter(r => r.available_from > today).length), available: rows.filter(r => r.available_from <= today).reduce((sum, r) => sum + r.days, 0) });
    }
    void load();
    return () => { active = false; };
  }, [user, reload]);
  async function signIn(provider: "google" | "lovable") {
    setBusy(true); setMessage("");
    try {
      const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/referrals${ref ? `?ref=${ref}` : ""}` });
      if (result.error) setMessage("Не удалось войти. Попробуйте ещё раз.");
    } catch { setMessage("Не удалось войти. Попробуйте ещё раз."); }
    finally { setBusy(false); }
  }
  async function accept() {
    if (!ref) return;
    setBusy(true); setMessage("");
    const { data, error } = await supabase.rpc("accept_referral", { invite_code: ref });
    setMessage(error ? "Приглашение недоступно: проверьте ссылку. Себя пригласить нельзя." : data ? "Приглашение принято! Другу начислены 30 дней на следующий месяц." : "Ваше приглашение уже было учтено.");
    setBusy(false); setReload(value => value + 1);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(link); setMessage("Ссылка скопирована"); }
    catch { setMessage("Не удалось скопировать. Выделите ссылку и скопируйте вручную."); }
  }
  async function share() {
    if (!navigator.share) { await copy(); return; }
    try { await navigator.share({ title: "Лазейка", text: "Присоединяйся к Лазейке — Telegram без лишних сложностей", url: link }); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setMessage("Не удалось отправить ссылку. Скопируйте её."); }
  }
  return <AppShell>
    <Logo small />
    <section className="mt-7 text-center">
      <IconImg src={gift} className="mx-auto h-24 w-24" />
      <h1 className="mt-3 text-2xl font-extrabold">Приглашай друзей</h1>
      <p className="mt-2 text-sm text-muted-foreground">За каждого друга — <strong className="text-primary">+{REFERRAL_DAYS} дней</strong><br />доступа на следующий месяц</p>
    </section>
    <ol className="mt-6 space-y-3 text-sm">
      {["Отправь другу свою ссылку", "Друг входит и принимает приглашение", "Получай 30 дней доступа на следующий месяц"].map((step, i) => <li key={step} className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky text-xs font-bold text-primary">{i + 1}</span>{step}</li>)}
    </ol>
    {!ready ? <p className="mt-6 text-center text-sm text-muted-foreground">Загрузка…</p> : !user ? <div className="mt-6 space-y-3">
      <p className="text-center text-sm text-muted-foreground">{ref ? "Войди, чтобы принять приглашение" : "Войди, чтобы получить личную ссылку"}</p>
      <Button disabled={busy} onClick={() => signIn("google")} className="h-12 w-full rounded-2xl">Войти через Google</Button>
      <Button disabled={busy} variant="outline" onClick={() => signIn("lovable")} className="h-12 w-full rounded-2xl">Войти через Lovable</Button>
    </div> : <>
      {ref && <Button disabled={busy} onClick={accept} className="mt-6 h-12 rounded-2xl">Принять приглашение</Button>}
      <div className="mt-6 grid grid-cols-3 gap-2 border-y border-border py-4 text-center">
        <div><p className="text-xl font-extrabold">{stats?.friends ?? "—"}</p><p className="text-xs text-muted-foreground">Друзей</p></div>
        <div><p className="text-xl font-extrabold text-primary">{stats ? `+${stats.pending}` : "—"}</p><p className="text-xs text-muted-foreground">В следующем месяце</p></div>
        <div><p className="text-xl font-extrabold text-success">{stats?.available ?? "—"}</p><p className="text-xs text-muted-foreground">Бонусных дней</p></div>
      </div>
      <p className="mt-5 text-sm font-semibold">Твоя ссылка</p>
      <input aria-label="Ссылка приглашения" readOnly value={link} onFocus={event => event.target.select()} className="mt-2 h-11 min-w-0 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground" />
      <div className="mt-3 flex gap-2">
        <Button disabled={!link} onClick={share} className="h-12 flex-1 rounded-2xl bg-gradient-primary shadow-button"><Share2 />Пригласить друга</Button>
        <Button disabled={!link} onClick={copy} variant="outline" title="Скопировать ссылку" aria-label="Скопировать ссылку" className="h-12 w-12 shrink-0 rounded-2xl"><Copy /></Button>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Бонусы за приглашения этого месяца — с {new Date(`${nextRewardMonth(new Date())}T00:00:00Z`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" })}</p>
      <Button variant="ghost" onClick={() => supabase.auth.signOut()} className="mt-4 self-center text-muted-foreground"><LogOut />Выйти</Button>
    </>}
    {message && <p role="status" className="mt-4 text-center text-sm text-muted-foreground">{message}</p>}
  </AppShell>;
}