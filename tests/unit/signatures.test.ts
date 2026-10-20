import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { randomCode, verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/signatures";

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("hex");

describe("Razorpay checkout signature verification", () => {
  const keySecret = "test_key_secret";
  const orderId = "order_ABC";
  const paymentId = "pay_XYZ";
  const valid = sign(`${orderId}|${paymentId}`, keySecret);

  it("accepts a correct signature", () => {
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: valid, keySecret })).toBe(true);
  });
  it("rejects a tampered payment id", () => {
    expect(verifyCheckoutSignature({ orderId, paymentId: "pay_OTHER", signature: valid, keySecret })).toBe(false);
  });
  it("rejects the wrong secret", () => {
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: valid, keySecret: "other" })).toBe(false);
  });
  it("rejects empty signature or secret", () => {
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: "", keySecret })).toBe(false);
    expect(verifyCheckoutSignature({ orderId, paymentId, signature: valid, keySecret: "" })).toBe(false);
  });
});

describe("Razorpay webhook signature verification", () => {
  const secret = "whsec_test";
  const body = JSON.stringify({ event: "payment.captured", payload: {} });

  it("accepts the signature of the exact raw body", () => {
    expect(verifyWebhookSignature(body, sign(body, secret), secret)).toBe(true);
  });
  it("rejects a modified body", () => {
    expect(verifyWebhookSignature(body.replace("captured", "failed"), sign(body, secret), secret)).toBe(false);
  });
  it("rejects missing signature and missing secret", () => {
    expect(verifyWebhookSignature(body, null, secret)).toBe(false);
    expect(verifyWebhookSignature(body, sign(body, secret), "")).toBe(false);
  });
  it("rejects signatures of a different length without throwing", () => {
    expect(verifyWebhookSignature(body, "abc", secret)).toBe(false);
  });
});

describe("verification codes", () => {
  it("uses an unambiguous alphabet", () => {
    for (let i = 0; i < 50; i++) expect(randomCode(10)).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
  });
});
