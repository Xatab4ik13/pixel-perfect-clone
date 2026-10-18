import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/admin/bootstrap")({
  server: {
    handlers: {
      POST: async (context) => {
        const { handlers } = await import("@/server/http-routes/admin-bootstrap.server");
        return handlers.POST(context);
      },
    },
  },
});
