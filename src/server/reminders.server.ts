// Expiry reminders (server-only): 3 days before and on the last day, with a
// button that opens the Mini App to renew. Runs hourly on the VPS process.
import { and, eq, gt, lte, sql } from "drizzle-orm";
import { getDb } from "./db.server";
import { subscriptions, users } from "./schema";
import { sendTelegramMessage } from "./telegram-notify.server";
import { env } from "./env.server";
import { dueReminder } from "@/lib/reminders";

function appUrl(): string {
  return (env.publicBaseUrl() || "https://lazeyka.hhr.pro").replace(/\/+$/, "");
}

export async function sendDueReminders(now = new Date()): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({
      userId: subscriptions.userId,
      end: subscriptions.currentPeriodEnd,
      r3: subscriptions.reminded3dFor,
      r0: subscriptions.reminded0dFor,
      tg: users.telegramUserId,
    })
    .from(subscriptions)
    .innerJoin(users, eq(users.id, subscriptions.userId))
    .where(
      and(
        eq(subscriptions.status, "active"),
        gt(subscriptions.currentPeriodEnd, now),
        lte(subscriptions.currentPeriodEnd, new Date(now.getTime() + 3 * 86400_000)),
      ),
    );

  let sent = 0;
  for (const r of rows) {
    const kind = dueReminder(r.end, now, { r3: r.r3, r0: r.r0 });
    if (!kind || !r.end) continue;
    const text =
      kind === "3d"
        ? "⏳ Доступ закончится через 3 дня. Продлите заранее, чтобы не потерять подключение."
        : "⚠️ Сегодня последний день доступа. Продлите, чтобы подключение продолжило работать.";
    try {
      await sendTelegramMessage(r.tg, text, {
        replyMarkup: { inline_keyboard: [[{ text: "Продлить доступ", web_app: { url: appUrl() } }]] },
      });
      sent++;
    } catch (e) {
      console.error("[reminders] send failed", r.tg, e instanceof Error ? e.message : e);
    }
    // Mark even on failure (e.g. bot blocked) so we don't retry every hour.
    await db
      .update(subscriptions)
      .set(kind === "3d" ? { reminded3dFor: r.end, updatedAt: sql`now()` } : { reminded0dFor: r.end, updatedAt: sql`now()` })
      .where(eq(subscriptions.userId, r.userId));
    await new Promise((res) => setTimeout(res, 50));
  }
  return sent;
}
