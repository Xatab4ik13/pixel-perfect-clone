
import { requireUser } from "@/server/auth.server";
import { getActiveLink } from "@/server/access.server";
import { handler, json } from "@/server/http";


export const handlers = {
      // Owner-only: returns the secret-bearing link only when access is active.
      GET: handler(async ({ request }: { request: Request }) => {
        const user = await requireUser(request);
        const link = await getActiveLink(user.id);
        if (!link) return json({ link: null }, { status: 200 });
        return json({ link }, { headers: { "cache-control": "no-store" } });
      }),
    };
