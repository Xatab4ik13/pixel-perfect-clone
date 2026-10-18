import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/me/link")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/me-link.server");
        return handlers.GET(context);
      },
    },
  },
});
