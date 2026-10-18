
import { clearSessionCookie } from "@/server/admin.server";
import { json } from "@/server/http";


export const handlers = {
      POST: () => json({ ok: true }, { headers: { "set-cookie": clearSessionCookie() } }),
    };
