
import { env } from "@/server/env.server";
import { json } from "@/server/http";


export const handlers = {
      GET: () => json({ botUsername: env.botUsername() || null }),
    };
