
import { requireAdmin, listUsers, AdminAuthError } from "@/server/admin.server";
import { json } from "@/server/http";


export const handlers = {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request, "viewer");
          const url = new URL(request.url);
          const query = url.searchParams.get("q") ?? "";
          return json({ users: await listUsers(query) });
        } catch (e) {
          if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
          console.error("[admin users]", e);
          return json({ error: "internal error" }, { status: 500 });
        }
      },
    };
