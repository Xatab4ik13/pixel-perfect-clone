import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/plans")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/plans.server");
        return handlers.GET();
      },
    },
  },
});
