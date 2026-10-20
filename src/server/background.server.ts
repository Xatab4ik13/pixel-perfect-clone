// Periodic jobs for the long-lived VPS node process: mask-domain checks and
// expiry reminders. Started once from src/server.ts; no-op without DATABASE_URL.
import { ensureDomainMonitor } from "./domains.server";
import { sendDueReminders } from "./reminders.server";

const REMINDER_INTERVAL_MS = 60 * 60 * 1000;

export function startBackgroundJobs(): void {
  const g = globalThis as { __lazeykaJobs?: boolean };
  if (g.__lazeykaJobs) return;
  if (!process.env["DATABASE_URL"] || process.env["NODE_ENV"] !== "production") return;
  g.__lazeykaJobs = true;
  ensureDomainMonitor();
  const tick = () =>
    void sendDueReminders().catch((e) => console.error("[reminders]", e instanceof Error ? e.message : e));
  setTimeout(tick, 60_000).unref?.();
  setInterval(tick, REMINDER_INTERVAL_MS).unref?.();
}
