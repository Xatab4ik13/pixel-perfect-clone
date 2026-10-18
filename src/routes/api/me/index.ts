import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/me/")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/me-index.server");
        return handlers.GET(context);
      },
    },
  },
});
