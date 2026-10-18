import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/pay/webhook")({
  server: {
    handlers: {
      POST: async (context) => {
        const { handlers } = await import("@/server/http-routes/pay-webhook.server");
        return handlers.POST(context);
      },
    },
  },
});
