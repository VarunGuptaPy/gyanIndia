import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/signatures";
import { confirmPayment, recordFailedPayment, recordRefundProcessed } from "@/server/payments";

export const runtime = "nodejs";

type PaymentEntity = { id: string; order_id: string; amount: number; status: string; method?: string; error_description?: string };
type RefundEntity = { id: string; payment_id: string; amount: number };

/**
 * Razorpay webhook. Authenticity is established solely by the HMAC signature of the
 * raw body. Processing is idempotent: handlers can safely run more than once, and
 * processed event ids are recorded.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });

  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let body: { event?: string; payload?: { payment?: { entity: PaymentEntity }; refund?: { entity: RefundEntity } } };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const event = body.event ?? "unknown";
  const eventId = req.headers.get("x-razorpay-event-id");

  if (eventId && (await db.webhookEvent.findUnique({ where: { id: eventId } }))) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const payment = body.payload?.payment?.entity;
  switch (event) {
    case "payment.captured":
    case "order.paid":
      if (payment && payment.status === "captured") {
        await confirmPayment({
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          amountPaise: payment.amount,
          method: payment.method ?? null,
          source: "WEBHOOK",
        });
      }
      break;
    case "payment.failed":
      if (payment) {
        await recordFailedPayment({
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
          amountPaise: payment.amount,
          method: payment.method ?? null,
          errorDescription: payment.error_description ?? null,
        });
      }
      break;
    case "refund.processed": {
      const refund = body.payload?.refund?.entity;
      if (refund) {
        await recordRefundProcessed({ razorpayRefundId: refund.id, razorpayPaymentId: refund.payment_id, amountPaise: refund.amount });
      }
      break;
    }
    default:
      break;
  }

  if (eventId) {
    await db.webhookEvent.create({ data: { id: eventId, event } }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
