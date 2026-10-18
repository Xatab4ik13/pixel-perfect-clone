// Payment provider abstraction (server-only).
//
// The product integrates with an existing fast-payments (СБП) system. The exact
// request/response shapes and signature algorithm depend on that provider's API
// — those spots are marked TODO(provider) and driven by env config, so wiring is
// complete and only the provider-specific details need filling in.
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "./db.server";
import { payments, type Payment } from "./schema";
import { env } from "./env.server";
import { applyPaidPayment } from "./access.server";
import { getPlan } from "@/lib/plans";

export interface CreatePaymentResult {
  providerPaymentId: string;
  /** URL to redirect/open for payment (card page) if applicable. */
  confirmationUrl?: string;
  /** СБП payload (QR string / deep link) if applicable. */
  sbpPayload?: string;
}

export interface WebhookResult {
  providerPaymentId: string;
  status: "paid" | "failed" | "pending" | "canceled";
  raw: unknown;
}

export interface PaymentProvider {
  readonly id: string;
  createPayment(input: {
    orderId: string;
    amountKopecks: number;
    description: string;
    returnUrl: string;
  }): Promise<CreatePaymentResult>;
  verifyWebhook(request: Request, rawBody: string): Promise<WebhookResult>;
}

/**
 * Raiffeisenbank e-commerce provider (one-time payments, no subscriptions).
 *
 * Create order (payment link):
 *   POST {base}/v1/merchants/{publicId}/orders
 *   Authorization: Bearer {secretKey}
 *   body: { id, amount (RUB, up to 2 decimals), comment, returnUrls }
 *   -> { payformUrl, id, status, ... }
 *
 * Callback (payment notification v3), header X-Api-Signature-SHA256 =
 *   HMAC-SHA-256(secretKey,
 *     data.amount|data.publicId|data.order.id|data.status.value|data.status.date)
 */
class RaifProvider implements PaymentProvider {
  readonly id = "raif";

  private cfg() {
    const base = (env.paymentApiUrl() || "https://pay.raif.ru/api").replace(/\/+$/, "");
    const publicId = env.paymentMerchantId();
    const secret = env.paymentSecret();
    if (!publicId || !secret) {
      throw new Error("Raiffeisen not configured (PAYMENT_MERCHANT_ID/PAYMENT_SECRET)");
    }
    return { base, publicId, secret };
  }

  async createPayment(input: {
    orderId: string;
    amountKopecks: number;
    description: string;
    returnUrl: string;
  }): Promise<CreatePaymentResult> {
    const { base, publicId, secret } = this.cfg();
    const body = {
      id: input.orderId,
      amount: input.amountKopecks / 100, // Raiffeisen expects rubles
      comment: input.description,
      returnUrls: { successUrl: input.returnUrl, failUrl: input.returnUrl },
    };
    const res = await fetch(`${base}/v1/merchants/${encodeURIComponent(publicId)}/orders`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Raiffeisen order create failed: ${res.status} ${await safeText(res)}`);
    }
    const data = (await res.json()) as { id?: string; payformUrl?: string };
    const providerPaymentId = data.id ?? input.orderId;
    if (!data.payformUrl) throw new Error("Raiffeisen did not return payformUrl");
    return { providerPaymentId, confirmationUrl: data.payformUrl.trim() };
  }

  async verifyWebhook(request: Request, rawBody: string): Promise<WebhookResult> {
    const { secret } = this.cfg();
    const provided = request.headers.get("x-api-signature-sha256") ?? "";

    const event = JSON.parse(rawBody) as {
      event?: string;
      data?: {
        amount?: number;
        publicId?: string;
        order?: { id?: string };
        status?: { value?: string; date?: string };
      };
    };
    const d = event.data;
    if (!d?.order?.id || !d.status) throw new Error("malformed Raiffeisen webhook");

    // Use the raw amount token to avoid float-formatting mismatches.
    const amountRaw = rawAmount(rawBody, d.amount);
    const control = [amountRaw, d.publicId ?? "", d.order.id, d.status.value ?? "", d.status.date ?? ""].join("|");
    const expected = sign(control, secret);
    if (!constantTimeEqual(expected, provided)) {
      throw new Error("invalid Raiffeisen webhook signature");
    }
    return { providerPaymentId: d.order.id, status: mapStatus(d.status.value), raw: event };
  }
}

/** Extract the exact textual amount from the raw body (preserves formatting). */
function rawAmount(rawBody: string, parsed: number | undefined): string {
  const m = /"amount"\s*:\s*([0-9]+(?:\.[0-9]+)?)/.exec(rawBody);
  return m ? m[1]! : String(parsed ?? "");
}

function mapStatus(s: string | undefined): WebhookResult["status"] {
  switch ((s ?? "").toUpperCase()) {
    case "SUCCESS":
    case "PAID":
    case "COMPLETED":
      return "paid";
    case "CANCELED":
    case "CANCELLED":
      return "canceled";
    case "DECLINED":
    case "FAILED":
    case "REJECTED":
      return "failed";
    default:
      return "pending";
  }
}

/**
 * Auto provider: marks the payment paid immediately with no real charge.
 * Used while real payments are not yet connected (PAYMENT_PROVIDER=auto).
 */
class AutoProvider implements PaymentProvider {
  readonly id = "auto";
  async createPayment(input: { orderId: string }): Promise<CreatePaymentResult> {
    return { providerPaymentId: `auto_${input.orderId}` };
  }
  verifyWebhook(): Promise<WebhookResult> {
    return Promise.reject(new Error("auto provider has no webhook"));
  }
}

export function getPaymentProvider(): PaymentProvider {
  switch (env.paymentProvider()) {
    case "auto":
      return new AutoProvider();
    case "raif":
    default:
      return new RaifProvider();
  }
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

/** Create a pending payment row and register it with the provider. */
export async function createPaymentForUser(
  userId: string,
  planId: string,
): Promise<{ payment: Payment; create: CreatePaymentResult; paid: boolean }> {
  const plan = getPlan(planId);
  if (!plan) throw new Error(`unknown plan: ${planId}`);

  const db = getDb();
  const inserted = await db
    .insert(payments)
    .values({
      userId,
      planId: plan.id,
      amountKopecks: plan.priceKopecks,
      currency: "RUB",
      provider: env.paymentProvider(),
      status: "pending",
      daysGranted: plan.days,
    })
    .returning();
  const payment = inserted[0]!;

  const provider = getPaymentProvider();
  const returnUrl = `${env.publicBaseUrl().replace(/\/+$/, "")}/access`;
  const create = await provider.createPayment({
    orderId: payment.id,
    amountKopecks: plan.priceKopecks,
    description: `Лазейка ${plan.name}`,
    returnUrl,
  });

  await db
    .update(payments)
    .set({ providerPaymentId: create.providerPaymentId })
    .where(eq(payments.id, payment.id));

  // Auto mode: settle immediately so access is granted on click.
  if (provider.id === "auto") {
    await applyPaidPayment(payment.id);
    return { payment, create, paid: true };
  }

  return { payment, create, paid: false };
}
