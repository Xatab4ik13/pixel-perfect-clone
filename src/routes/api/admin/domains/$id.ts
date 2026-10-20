import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/domains/$id")({
  server: {
    handlers: {
      POST: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-domains-param-id.server");
        return handlers.POST(context);
      },
    },
  },
});
