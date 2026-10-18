
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db.server";
import { payments } from "@/server/schema";
import { getPaymentProvider } from "@/server/payments.server";
import { applyPaidPayment } from "@/server/access.server";
import { json } from "@/server/http";


export const handlers = {
      // Provider -> us. No CSRF (server route); authenticity is the signature.
      POST: async ({ request }) => {
        try {
          const rawBody = await request.text();
          const provider = getPaymentProvider();
          const event = await provider.verifyWebhook(request, rawBody);

          const db = getDb();
          const rows = await db
            .select()
            .from(payments)
            .where(eq(payments.providerPaymentId, event.providerPaymentId))
            .limit(1);
          const payment = rows[0];
          if (!payment) return json({ ok: false, error: "unknown payment" }, { status: 404 });

          if (event.status === "paid") {
            await applyPaidPayment(payment.id);
          } else if (event.status === "failed" || event.status === "canceled") {
            await db
              .update(payments)
              .set({ status: event.status })
              .where(eq(payments.id, payment.id));
          }
          return json({ ok: true });
        } catch (e) {
          console.error("[webhook] error:", e);
          // 400 so the provider retries on transient/invalid-signature issues.
          return json({ ok: false }, { status: 400 });
        }
      },
    };
