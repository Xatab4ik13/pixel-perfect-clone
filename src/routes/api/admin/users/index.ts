import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/users/")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-users-index.server");
        return handlers.GET(context);
      },
    },
  },
});
