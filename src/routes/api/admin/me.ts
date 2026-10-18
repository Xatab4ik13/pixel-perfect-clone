import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/me")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-me.server");
        return handlers.GET(context);
      },
    },
  },
});
