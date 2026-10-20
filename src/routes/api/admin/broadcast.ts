import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/broadcast")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-broadcast.server");
        return handlers.GET(context);
      },
      POST: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-broadcast.server");
        return handlers.POST(context);
      },
    },
  },
});
