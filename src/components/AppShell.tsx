import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import plane from "@/assets/icon-plane.png";
import tabHome from "@/assets/icon-home.png";
import tabCalendar from "@/assets/icon-tab-calendar.png";
import tabHelp from "@/assets/icon-tab-help.png";
import tabProfile from "@/assets/icon-profile.png";
import { useDemo } from "@/components/DemoProvider";
import { TelegramGate } from "@/components/TelegramGate";
import { canShowApp } from "@/lib/app-visibility";

export function AppShell({ children }: { children: ReactNode }) {
  const { isTelegram, loading } = useDemo();
  if (loading) return <div className="min-h-screen bg-gradient-sky" />;
  if (!canShowApp(isTelegram, import.meta.env.DEV)) return <TelegramGate />;

  const tabs = [
    { to: "/", label: "Главная", icon: tabHome },
    { to: "/access", label: "Мой доступ", icon: tabCalendar },
    { to: "/help", label: "Помощь", icon: tabHelp },
    { to: "/profile", label: "Кабинет", icon: tabProfile },
  ] as const;
  return (
    <div className="min-h-screen bg-gradient-sky">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-28 pt-6">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {tabs.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground"
              activeProps={{ className: "text-primary font-semibold" }}
            >
              {({ isActive }) => (
                <>
                  <img
                    src={icon}
                    alt=""
                    width={256}
                    height={256}
                    className={`h-8 w-8 object-contain transition ${isActive ? "scale-110" : "opacity-50 grayscale"}`}
                  />
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
