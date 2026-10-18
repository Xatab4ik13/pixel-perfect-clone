
import { bootstrapAdmin, AdminAuthError } from "@/server/admin.server";
import { json } from "@/server/http";


export const handlers = {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as {
            email?: string;
            password?: string;
            token?: string;
          };
          if (!body.email || !body.password || !body.token) {
            return json({ error: "email, password, token required" }, { status: 400 });
          }
          const admin = await bootstrapAdmin(body.email, body.password, body.token);
          return json({ ok: true, email: admin.email });
        } catch (e) {
          if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
          console.error("[admin bootstrap]", e);
          return json({ error: "internal error" }, { status: 500 });
        }
      },
    };
