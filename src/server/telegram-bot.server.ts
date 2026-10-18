// Server-only Telegram Bot logic: /start handler + webhook/menu configuration.
import { env } from "./env.server";
import { sendTelegramMessage } from "./telegram-notify.server";
import { tgCall } from "./telegram-transport.server";

function baseUrl(): string {
  return (env.publicBaseUrl() || "https://lazeyka.hhr.pro").replace(/\/+$/, "");
}

async function botApi(method: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await tgCall(method, body);
  return res.raw;
}

/** Reply to /start with a welcome message and a button that opens the Mini App. */
export async function handleStart(chatId: number, firstName?: string): Promise<void> {
  const url = baseUrl();
  const hi = firstName ? `Привет, ${firstName}!` : "Привет!";
  const text =
    `${hi}\n\n` +
    `Это <b>Лазейка</b> — быстрый доступ в одно нажатие.\n` +
    `Откройте приложение, чтобы оформить доступ и управлять им.`;
  await sendTelegramMessage(chatId, text, {
    replyMarkup: { inline_keyboard: [[{ text: "🚀 Открыть Лазейку", web_app: { url } }]] },
  });
}

/** Register the webhook + set the chat menu button to open the Mini App. */
export async function configureBot(): Promise<{ me: unknown; webhook: unknown; menu: unknown }> {
  const url = baseUrl();
  const me = await botApi("getMe", {});
  const webhook = await botApi("setWebhook", {
    url: `${url}/api/tg/webhook`,
    secret_token: env.botWebhookSecret() || undefined,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  const menu = await botApi("setChatMenuButton", {
    menu_button: { type: "web_app", text: "Открыть", web_app: { url } },
  });
  return { me, webhook, menu };
}
