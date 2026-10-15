import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Send } from "lucide-react";
import { AppShell, IconImg, Logo } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useDemo } from "@/components/DemoProvider";
import { rewardDays } from "@/lib/referral-rules";
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
  const { code } = useDemo();
  const [message, setMessage] = useState('');
  const friends = 3;
  const days = rewardDays(friends);
  const link = `https://t.me/lazeyka_demo_bot?start=ref_${code || 'demo'}`;
  async function copy() { try { await navigator.clipboard.writeText(link); setMessage('Ссылка скопирована'); } catch { setMessage('Выделите ссылку и скопируйте её'); } }
  async function share() { if (!navigator.share) { await copy(); return; } try { await navigator.share({ title: 'Лазейка', text: 'Присоединяйся к Лазейке', url: link }); } catch { /* Closing the share dialog is not an error. */ } }
  return <AppShell><Logo small />
    <section className="mt-6 text-center"><IconImg src={gift} className="mx-auto h-20 w-20" /><h2 className="mt-2 text-2xl font-extrabold">Друзья с вами — дни в подарок</h2><p className="mt-3 text-sm text-muted-foreground">За каждого друга — <strong className="text-primary">+30 дней</strong><br />на следующий месяц</p></section>
    <div className="mt-6 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-card p-4 text-center shadow-soft"><div className="referral-ring mx-auto flex h-24 w-24 items-center justify-center rounded-full"><div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card"><strong className="text-3xl font-extrabold">{friends}</strong><span className="text-xs text-muted-foreground">друга</span></div></div><p className="mt-3 text-sm font-bold">Приглашено</p><p className="mt-1 text-xs text-muted-foreground">Следующая отметка: 5</p></div>
      <div className="rounded-2xl bg-card p-4 text-center shadow-soft"><div className="referral-ring reward-ring mx-auto flex h-24 w-24 items-center justify-center rounded-full"><div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-card"><strong className="text-3xl font-extrabold text-success">+{days}</strong><span className="text-xs text-muted-foreground">дней</span></div></div><p className="mt-3 text-sm font-bold">Получено</p><p className="mt-1 text-xs text-muted-foreground">На следующий месяц</p></div>
    </div>
    <p className="mt-3 text-center text-xs text-muted-foreground">Пример начислений · 3 друга × 30 дней</p>
    <h2 className="mt-6 text-base font-bold">Ваша личная ссылка</h2><input aria-label="Ссылка приглашения" value={link} readOnly onFocus={e => e.target.select()} className="mt-3 h-12 min-w-0 rounded-xl border border-border bg-card px-3 text-xs text-muted-foreground" />
    <div className="mt-3 flex gap-3"><Button onClick={share} className="h-12 flex-1 rounded-2xl bg-gradient-primary shadow-button"><Send />Пригласить друга</Button><Button onClick={copy} variant="outline" className="h-12 w-12 rounded-2xl" aria-label="Скопировать ссылку" title="Скопировать ссылку"><Copy /></Button></div>
    {message && <p role="status" className="mt-3 text-center text-sm text-primary">{message}</p>}
    <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">Друг открывает бота по ссылке — приглашение учитывается.<br />Сейчас ссылка демонстрационная.</p>
  </AppShell>;
}
