import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/config")({
  server: {
    handlers: {
      GET: async (context) => {
        const { handlers } = await import("@/server/http-routes/config.server");
        return handlers.GET();
      },
    },
  },
});
