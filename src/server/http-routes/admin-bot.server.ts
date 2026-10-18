
import { requireAdmin, AdminAuthError } from "@/server/admin.server";
import { configureBot } from "@/server/telegram-bot.server";
import { json } from "@/server/http";


export const handlers = {
      POST: async ({ request }: { request: Request }) => {
        try {
          await requireAdmin(request, "admin");
          const result = await configureBot();
          return json({ ok: true, result });
        } catch (e) {
          if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
          console.error("[admin bot] ", e);
          return json({ error: "internal error" }, { status: 500 });
        }
      },
    };
