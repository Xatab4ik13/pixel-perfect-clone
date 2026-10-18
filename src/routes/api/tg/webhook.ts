import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tg/webhook")({
  server: {
    handlers: {
      POST: async (context) => {
        const { handlers } = await import("@/server/http-routes/tg-webhook.server");
        return handlers.POST(context);
      },
    },
  },
});
