
import { requireAdmin, getEconomics, AdminAuthError } from "@/server/admin.server";
import { json } from "@/server/http";


export const handlers = {
      GET: async ({ request }) => {
        try {
          await requireAdmin(request, "viewer");
          return json(await getEconomics());
        } catch (e) {
          if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
          console.error("[admin metrics]", e);
          return json({ error: "internal error" }, { status: 500 });
        }
      },
    };
