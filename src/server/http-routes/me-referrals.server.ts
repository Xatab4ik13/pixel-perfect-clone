
import { requireUser } from "@/server/auth.server";
import { getReferralStats } from "@/server/referrals.server";
import { env } from "@/server/env.server";
import { handler, json } from "@/server/http";
import { buildInviteLink } from "@/lib/referral-rules";


export const handlers = {
      GET: handler(async ({ request }: { request: Request }) => {
        const user = await requireUser(request);
        const stats = await getReferralStats(user.id);
        return json({
          code: stats.code,
          invited: stats.invited,
          rewarded: stats.rewarded,
          rewardDays: stats.rewardDays,
          perFriendDays: stats.perFriendDays,
          link: buildInviteLink(env.botUsername() || null, stats.code),
        });
      }),
    };
