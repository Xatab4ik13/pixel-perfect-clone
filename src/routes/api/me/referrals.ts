import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/me/referrals")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/me-referrals.server");
        return handlers.GET(context);
      },
    },
  },
});
