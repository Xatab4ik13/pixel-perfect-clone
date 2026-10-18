
import { requireAdmin, recordAudit, AdminAuthError } from "@/server/admin.server";
import { setSuspended, rotateUserSecret, activateAccess } from "@/server/access.server";
import { json } from "@/server/http";


export const handlers = {
      POST: async ({ request, params }) => {
        try {
          const session = await requireAdmin(request, "operator");
          const userId = params.id;
          const body = (await request.json().catch(() => ({}))) as {
            action?: string;
            reason?: string;
            days?: number;
          };
          const reason = (body.reason ?? "").trim();
          if (!reason) return json({ error: "reason required" }, { status: 400 });

          switch (body.action) {
            case "suspend":
              await setSuspended(userId, true);
              break;
            case "resume":
              await setSuspended(userId, false);
              break;
            case "rotate":
              await rotateUserSecret(userId);
              break;
            case "grant": {
              const days = Number(body.days);
              if (!Number.isFinite(days) || days <= 0) {
                return json({ error: "days must be a positive number" }, { status: 400 });
              }
              await activateAccess(userId, days);
              break;
            }
            default:
              return json({ error: "unknown action" }, { status: 400 });
          }

          await recordAudit(session.sub, `user.${body.action}`, userId, reason);
          return json({ ok: true });
        } catch (e) {
          if (e instanceof AdminAuthError) return json({ error: e.message }, { status: e.status });
          console.error("[admin user action]", e);
          return json({ error: "internal error" }, { status: 500 });
        }
      },
    };
