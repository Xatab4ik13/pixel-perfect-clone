import { Link } from "@tanstack/react-router";
import { Home, CalendarDays, HelpCircle, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import plane from "@/assets/icon-plane.png";

export function AppShell({ children }: { children: ReactNode }) {
  const tabs = [
    { to: "/", label: "Главная", icon: Home },
    { to: "/access", label: "Мой доступ", icon: CalendarDays },
    { to: "/help", label: "Помощь", icon: HelpCircle },
  ] as const;
  return (
    <div className="min-h-screen bg-gradient-sky">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-28 pt-6">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-6 w-6" fill={isActive ? "currentColor" : "none"} fillOpacity={isActive ? 0.9 : 0} />
                  {label}
                </>
              )}
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
      <img src={plane} alt="" width={256} height={256} className={small ? "h-16 w-16" : "h-24 w-24"} />
      <h1 className={`${small ? "text-3xl" : "text-[2.6rem] leading-none"} mt-2 font-extrabold tracking-tight`}>Лазейка</h1>
      <p className="mt-2 text-sm text-muted-foreground">Telegram без лишних сложностей</p>
    </div>
  );
}

export function IconImg({ src, className = "h-9 w-9" }: { src: string; className?: string }) {
  return <img src={src} alt="" width={256} height={256} loading="lazy" className={`${className} object-contain`} />;
}

export function Row({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <button className="flex w-full items-center gap-4 px-4 py-4 text-left">
      <IconImg src={icon} className="h-8 w-8" />
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </button>
  );
}
