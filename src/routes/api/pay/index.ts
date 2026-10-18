import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/pay/")({
  server: {
    handlers: {
      POST: async (context) => {
        const { handlers } = await import("@/server/http-routes/pay-index.server");
        return handlers.POST(context);
      },
    },
  },
});
