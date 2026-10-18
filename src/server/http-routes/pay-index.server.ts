
import { requireUser } from "@/server/auth.server";
import { createPaymentForUser } from "@/server/payments.server";
import { handler, json } from "@/server/http";


export const handlers = {
      // Create a payment for the authenticated user. Body: { planId }.
      POST: handler(async ({ request }: { request: Request }) => {
        const user = await requireUser(request);
        const body = (await request.json().catch(() => ({}))) as { planId?: string };
        if (!body.planId) return json({ error: "planId required" }, { status: 400 });

        const { payment, create, paid } = await createPaymentForUser(user.id, body.planId);
        return json({
          paymentId: payment.id,
          paid,
          confirmationUrl: create.confirmationUrl ?? null,
          sbpPayload: create.sbpPayload ?? null,
        });
      }),
    };
