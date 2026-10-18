import { describe, it, expect, beforeAll } from "vitest";
import { createHmac } from "node:crypto";
import { getPaymentProvider } from "@/server/payments.server";

const SECRET = "raif-test-secret-key";
const PUBLIC_ID = "138865-1708";

beforeAll(() => {
  process.env["PAYMENT_PROVIDER"] = "raif";
  process.env["PAYMENT_MERCHANT_ID"] = PUBLIC_ID;
  process.env["PAYMENT_SECRET"] = SECRET;
});

function sign(control: string): string {
  return createHmac("sha256", SECRET).update(control).digest("hex");
}

function webhook(sig: string, body: string): Request {
  return new Request("http://x/api/pay/webhook", {
    method: "POST",
    headers: { "x-api-signature-sha256": sig },
    body,
  });
}

const data = {
  id: "pay-1",
  publicId: PUBLIC_ID,
  amount: 199,
  order: { id: "order-1" },
  status: { value: "SUCCESS", date: "2026-01-01T00:00:00+03:00" },
};
const body = JSON.stringify({ event: "PAYMENT", data });
// data.amount|data.publicId|data.order.id|data.status.value|data.status.date
const control = `199|${PUBLIC_ID}|order-1|SUCCESS|2026-01-01T00:00:00+03:00`;

describe("Raiffeisen webhook v3 signature", () => {
  it("accepts a correctly signed SUCCESS notification", async () => {
    const res = await getPaymentProvider().verifyWebhook(webhook(sign(control), body), body);
    expect(res.status).toBe("paid");
    expect(res.providerPaymentId).toBe("order-1");
  });

  it("rejects a bad signature", async () => {
    await expect(getPaymentProvider().verifyWebhook(webhook("deadbeef", body), body)).rejects.toThrow();
  });

  it("rejects when the body is tampered after signing", async () => {
    const tampered = body.replace('"amount":199', '"amount":9999');
    await expect(getPaymentProvider().verifyWebhook(webhook(sign(control), tampered), tampered)).rejects.toThrow();
  });
});
