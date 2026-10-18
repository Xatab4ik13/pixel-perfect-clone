import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/login")({
  server: {
    handlers: {
      POST: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-login.server");
        return handlers.POST(context);
      },
    },
  },
});
