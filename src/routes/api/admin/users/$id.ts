import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/users/$id")({
  server: {
    handlers: {
      POST: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-users-param-id.server");
        return handlers.POST(context);
      },
    },
  },
});
