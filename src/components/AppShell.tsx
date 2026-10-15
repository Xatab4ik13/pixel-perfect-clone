import { Link } from "@tanstack/react-router";
import { Home, CalendarDays, HelpCircle, Send } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const tabs = [
    { to: "/", label: "Главная", icon: Home },
    { to: "/access", label: "Мой доступ", icon: CalendarDays },
    { to: "/help", label: "Помощь", icon: HelpCircle },
  ] as const;
  return (
    <div className="min-h-screen bg-gradient-sky">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-28 pt-8">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/90 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function Logo({ small }: { small?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Send className={`${small ? "h-10 w-10" : "h-16 w-16"} -rotate-12 fill-primary/30 text-primary`} />
      <h1 className={`${small ? "text-2xl" : "text-4xl"} mt-3 font-extrabold tracking-tight`}>Лазейка</h1>
      <p className="mt-1 text-sm text-muted-foreground">Telegram без лишних сложностей</p>
    </div>
  );
}

export function Row({ icon, title, sub, onClick }: { icon: ReactNode; title: string; sub: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-4 px-4 py-4 text-left">
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
      <span className="text-muted-foreground">›</span>
    </button>
  );
}
