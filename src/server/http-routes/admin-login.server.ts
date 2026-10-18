
import { login, sessionCookie, AdminAuthError } from "@/server/admin.server";
import { json } from "@/server/http";


export const handlers = {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
          if (!body.email || !body.password) {
            return json({ error: "email and password required" }, { status: 400 });
          }
          const { token, admin } = await login(body.email, body.password);
          return json(
            { ok: true, role: admin.role, email: admin.email },
            { headers: { "set-cookie": sessionCookie(token) } },
          );
        } catch (e) {
          if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
          console.error("[admin login]", e);
          return json({ error: "internal error" }, { status: 500 });
        }
      },
    };
