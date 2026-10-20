import { createHmac, randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createRegistration } from "@/server/registration";
import { confirmPayment, createOrderForRegistration, expectedTotal, PaymentError } from "@/server/payments";
import { POST as webhook } from "@/app/api/payments/webhook/route";
import { ctx, registrationInput, resetDb } from "../support/factory";

const WEBHOOK_SECRET = "whsec_integration_test";

async function pendingRegistrationWithOrder(subjectIds: string[]) {
  const r = await createRegistration(registrationInput(subjectIds), null, ctx);
  if (!r.ok) throw new Error(r.error);
  const reg = await db.registration.findUniqueOrThrow({ where: { id: r.registrationId } });
  // Stands in for the order Razorpay would return from orders.create.
  const order = await db.paymentOrder.create({
    data: { registrationId: reg.id, razorpayOrderId: `order_${randomUUID().slice(0, 12)}`, amountPaise: reg.totalPaise, receipt: `rg_${randomUUID().slice(0, 10)}` },
  });
  return { reg, order };
}

function signedWebhook(body: object, eventId = `evt_${randomUUID()}`, secret = WEBHOOK_SECRET) {
  const raw = JSON.stringify(body);
  return new Request("http://localhost/api/payments/webhook", {
    method: "POST",
    body: raw,
    headers: {
      "x-razorpay-signature": createHmac("sha256", secret).update(raw).digest("hex"),
      "x-razorpay-event-id": eventId,
      "content-type": "application/json",
    },
  });
}

const capturedEvent = (orderId: string, paymentId: string, amount: number) => ({
  event: "payment.captured",
  payload: { payment: { entity: { id: paymentId, order_id: orderId, amount, status: "captured", method: "upi" } } },
});

let subjects: Awaited<ReturnType<typeof resetDb>>["subjects"];
beforeEach(async () => {
  ({ subjects } = await resetDb());
  process.env.RAZORPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;
});

describe("payment amount verification", () => {
  it("derives the payable amount from stored line items", async () => {
    const { reg } = await pendingRegistrationWithOrder([subjects[0].id, subjects[1].id]);
    const full = await db.registration.findUniqueOrThrow({ where: { id: reg.id }, include: { subjects: true } });
    expect(expectedTotal(full)).toBe(55000);
  });

  it("rejects a captured payment whose amount differs from the order", async () => {
    const { reg, order } = await pendingRegistrationWithOrder([subjects[0].id]);
    const r = await confirmPayment({ razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_1", amountPaise: 100, source: "WEBHOOK" });
    expect(r.status).toBe("amount_mismatch");
    expect((await db.registration.findUniqueOrThrow({ where: { id: reg.id } })).status).toBe("PENDING_PAYMENT");
    expect(await db.auditLog.count({ where: { action: "payment.amount_mismatch" } })).toBe(1);
  });

  it("refuses to create orders when payments are not configured (no simulated success)", async () => {
    const { reg } = await pendingRegistrationWithOrder([subjects[0].id]);
    await expect(createOrderForRegistration(reg.id, "any-user")).rejects.toBeInstanceOf(PaymentError);
  });

  it("refuses live keys unless explicitly approved", async () => {
    process.env.RAZORPAY_KEY_ID = "rzp_live_x";
    process.env.RAZORPAY_KEY_SECRET = "secret";
    const { reg } = await pendingRegistrationWithOrder([subjects[0].id]);
    await expect(createOrderForRegistration(reg.id, "any-user")).rejects.toThrow(/awaiting approval/);
  });
});

describe("payment idempotency", () => {
  it("confirms once and assigns a single registration number", async () => {
    const { reg, order } = await pendingRegistrationWithOrder([subjects[0].id]);
    const p = { razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_A", amountPaise: order.amountPaise };
    const first = await confirmPayment({ ...p, source: "CHECKOUT_SIGNATURE" });
    const second = await confirmPayment({ ...p, source: "WEBHOOK" });
    expect(first).toMatchObject({ status: "confirmed", newlyConfirmed: true });
    expect(second).toMatchObject({ status: "confirmed", newlyConfirmed: false });
    const after = await db.registration.findUniqueOrThrow({ where: { id: reg.id } });
    expect(after.status).toBe("CONFIRMED");
    expect(after.registrationNumber).toBe("NTHE26-000001");
    expect(await db.payment.count()).toBe(1);
  });

  it("is safe under concurrent confirmation from checkout and webhook", async () => {
    const { order } = await pendingRegistrationWithOrder([subjects[0].id]);
    const p = { razorpayOrderId: order.razorpayOrderId, razorpayPaymentId: "pay_B", amountPaise: order.amountPaise };
    const results = await Promise.allSettled([
      confirmPayment({ ...p, source: "CHECKOUT_SIGNATURE" }),
      confirmPayment({ ...p, source: "WEBHOOK" }),
      confirmPayment({ ...p, source: "WEBHOOK" }),
    ]);
    const fulfilled = results.filter((r) => r.status === "fulfilled").map((r) => (r as PromiseFulfilledResult<{ newlyConfirmed?: boolean }>).value);
    expect(fulfilled.filter((r) => r.newlyConfirmed).length).toBe(1);
    expect(await db.payment.count()).toBe(1);
    expect(await db.counter.findFirst()).toMatchObject({ value: 1 });
  });

  it("gives sequential registration numbers to different registrations", async () => {
    const a = await pendingRegistrationWithOrder([subjects[0].id]);
    const b = await pendingRegistrationWithOrder([subjects[1].id]);
    await confirmPayment({ razorpayOrderId: a.order.razorpayOrderId, razorpayPaymentId: "pay_1", amountPaise: a.order.amountPaise, source: "WEBHOOK" });
    await confirmPayment({ razorpayOrderId: b.order.razorpayOrderId, razorpayPaymentId: "pay_2", amountPaise: b.order.amountPaise, source: "WEBHOOK" });
    const numbers = (await db.registration.findMany({ orderBy: { confirmedAt: "asc" } })).map((r) => r.registrationNumber);
    expect(numbers).toEqual(["NTHE26-000001", "NTHE26-000002"]);
  });

  it("ignores unknown orders", async () => {
    expect((await confirmPayment({ razorpayOrderId: "order_unknown", razorpayPaymentId: "pay_x", amountPaise: 1, source: "WEBHOOK" })).status).toBe("unknown_order");
  });
});

describe("payment webhook", () => {
  it("rejects an invalid signature and changes nothing", async () => {
    const { reg, order } = await pendingRegistrationWithOrder([subjects[0].id]);
    const res = await webhook(signedWebhook(capturedEvent(order.razorpayOrderId, "pay_W", order.amountPaise), undefined, "wrong_secret"));
    expect(res.status).toBe(400);
    expect((await db.registration.findUniqueOrThrow({ where: { id: reg.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("confirms a registration from a correctly signed payment.captured event", async () => {
    const { reg, order } = await pendingRegistrationWithOrder([subjects[0].id]);
    const res = await webhook(signedWebhook(capturedEvent(order.razorpayOrderId, "pay_W", order.amountPaise)));
    expect(res.status).toBe(200);
    const after = await db.registration.findUniqueOrThrow({ where: { id: reg.id }, include: { paymentOrders: { include: { payments: true } } } });
    expect(after.status).toBe("CONFIRMED");
    expect(after.paymentOrders[0].payments[0].verifiedVia).toBe("WEBHOOK");
  });

  it("processes a redelivered event only once", async () => {
    const { order } = await pendingRegistrationWithOrder([subjects[0].id]);
    const body = capturedEvent(order.razorpayOrderId, "pay_R", order.amountPaise);
    await webhook(signedWebhook(body, "evt_same"));
    const res = await webhook(signedWebhook(body, "evt_same"));
    expect(await res.json()).toMatchObject({ duplicate: true });
    expect(await db.payment.count()).toBe(1);
    expect(await db.webhookEvent.count()).toBe(1);
  });

  it("records failed payments without confirming", async () => {
    const { reg, order } = await pendingRegistrationWithOrder([subjects[0].id]);
    await webhook(signedWebhook({ event: "payment.failed", payload: { payment: { entity: { id: "pay_F", order_id: order.razorpayOrderId, amount: order.amountPaise, status: "failed", error_description: "Bank declined" } } } }));
    expect((await db.payment.findFirstOrThrow()).status).toBe("FAILED");
    expect((await db.registration.findUniqueOrThrow({ where: { id: reg.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("does not confirm when the webhook amount is tampered", async () => {
    const { reg, order } = await pendingRegistrationWithOrder([subjects[0].id]);
    await webhook(signedWebhook(capturedEvent(order.razorpayOrderId, "pay_T", 100)));
    expect((await db.registration.findUniqueOrThrow({ where: { id: reg.id } })).status).toBe("PENDING_PAYMENT");
  });

  it("marks a registration refunded when a full refund is processed", async () => {
    const { reg, order } = await pendingRegistrationWithOrder([subjects[0].id]);
    await webhook(signedWebhook(capturedEvent(order.razorpayOrderId, "pay_RF", order.amountPaise)));
    await webhook(signedWebhook({ event: "refund.processed", payload: { refund: { entity: { id: "rfnd_1", payment_id: "pay_RF", amount: order.amountPaise } } } }));
    expect((await db.registration.findUniqueOrThrow({ where: { id: reg.id } })).status).toBe("REFUNDED");
    expect((await db.payment.findFirstOrThrow()).status).toBe("REFUNDED");
  });
});
