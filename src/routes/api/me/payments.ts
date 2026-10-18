import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/me/payments")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/me-payments.server");
        return handlers.GET(context);
      },
    },
  },
});
