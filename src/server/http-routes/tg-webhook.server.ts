
import { env } from "@/server/env.server";
import { handleStart } from "@/server/telegram-bot.server";
import { json } from "@/server/http";



interface TgUpdate {
  message?: {
    text?: string;
    chat?: { id?: number };
    from?: { first_name?: string };
  };
}


export const handlers = {
      POST: async ({ request }: { request: Request }) => {
        // Authenticity: Telegram echoes our secret token on every call.
        const secret = env.botWebhookSecret();
        if (secret && request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
          return json({ ok: false }, { status: 401 });
        }
        const update = (await request.json().catch(() => ({}))) as TgUpdate;
        const msg = update.message;
        if (msg?.chat?.id && typeof msg.text === "string" && msg.text.startsWith("/start")) {
          try {
            await handleStart(msg.chat.id, msg.from?.first_name);
          } catch (e) {
            console.error("[bot] /start failed:", e instanceof Error ? e.message : e);
          }
        }
        return json({ ok: true });
      },
    };
