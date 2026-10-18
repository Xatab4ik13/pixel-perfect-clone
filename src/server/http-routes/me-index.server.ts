
import { requireUser } from "@/server/auth.server";
import { getAccessView } from "@/server/access.server";
import { handler, json } from "@/server/http";


export const handlers = {
      GET: handler(async ({ request }) => {
        const user = await requireUser(request);
        const access = await getAccessView(user.id);
        return json({
          user: {
            id: user.id,
            telegramUserId: user.telegramUserId,
            username: user.username,
            firstName: user.firstName,
            role: user.role,
          },
          access,
        });
      }),
    };
