import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/bot")({
  server: {
    handlers: {
      POST: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-bot.server");
        return handlers.POST(context);
      },
    },
  },
});
