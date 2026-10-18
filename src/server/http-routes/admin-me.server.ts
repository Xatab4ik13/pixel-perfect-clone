
import { requireAdmin, AdminAuthError } from "@/server/admin.server";
import { json } from "@/server/http";


export const handlers = {
      GET: async ({ request }) => {
        try {
          const session = await requireAdmin(request);
          return json({ id: session.sub, role: session.role });
        } catch (e) {
          if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
          return json({ error: "internal error" }, { status: 500 });
        }
      },
    };
