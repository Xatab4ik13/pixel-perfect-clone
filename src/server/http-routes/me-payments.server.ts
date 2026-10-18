
import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/server/auth.server";
import { getDb } from "@/server/db.server";
import { payments } from "@/server/schema";
import { handler, json } from "@/server/http";


export const handlers = {
      GET: handler(async ({ request }: { request: Request }) => {
        const user = await requireUser(request);
        const db = getDb();
        const rows = await db
          .select({
            id: payments.id,
            planId: payments.planId,
            amountKopecks: payments.amountKopecks,
            status: payments.status,
            daysGranted: payments.daysGranted,
            createdAt: payments.createdAt,
            paidAt: payments.paidAt,
          })
          .from(payments)
          .where(eq(payments.userId, user.id))
          .orderBy(desc(payments.createdAt))
          .limit(20);
        return json({
          payments: rows.map((r) => ({
            id: r.id,
            planId: r.planId,
            amount: r.amountKopecks / 100,
            status: r.status,
            days: r.daysGranted,
            paidAt: (r.paidAt ?? r.createdAt)?.toISOString() ?? null,
          })),
        });
      }),
    };
