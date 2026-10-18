import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/metrics")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-metrics.server");
        return handlers.GET(context);
      },
    },
  },
});
