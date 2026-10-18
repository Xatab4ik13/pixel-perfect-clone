// Server-only Telegram Bot API helper for user notifications.
// Used to DM a user their activation / payment confirmation. The proxy link we
// send here is the user's OWN personal link delivered privately to them — it is
// never written to logs.
import { tgCall } from "./telegram-transport.server";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface SendOpts {
  replyMarkup?: unknown;
}

export async function sendTelegramMessage(chatId: number, text: string, opts: SendOpts = {}): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (opts.replyMarkup) body["reply_markup"] = opts.replyMarkup;

  const res = await tgCall("sendMessage", body);
  if (!res.ok) {
    throw new Error(`telegram sendMessage -> ${res.status} ${res.description ?? ""}`.trim());
  }
}

/** DM the user that access is active, with a one-tap connect button (t.me link). */
export async function notifyAccessGranted(
  telegramUserId: number,
  tmeLink: string,
  periodEnd: Date,
  planName?: string | null,
): Promise<void> {
  const until = periodEnd.toLocaleDateString("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const head = planName ? `✅ Оплата получена — ${escapeHtml(planName)}.` : "✅ Оплата получена.";
  const text = `${head}\nДоступ активен до <b>${until}</b>.\nНажмите кнопку ниже, чтобы подключиться в Telegram.`;
  const replyMarkup = { inline_keyboard: [[{ text: "🔌 Подключить", url: tmeLink }]] };
  await sendTelegramMessage(telegramUserId, text, { replyMarkup });
}

/** Best-effort variant: never throws (for use inside flows that must not fail). */
export async function tryNotifyAccessGranted(
  telegramUserId: number,
  tmeLink: string,
  periodEnd: Date,
  planName?: string | null,
): Promise<void> {
  try {
    await notifyAccessGranted(telegramUserId, tmeLink, periodEnd, planName);
  } catch (e) {
    console.error("[notify] failed for", telegramUserId, e instanceof Error ? e.message : e);
  }
}
