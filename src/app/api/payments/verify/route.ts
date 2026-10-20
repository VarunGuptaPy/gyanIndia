import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { verifyCheckoutSignature } from "@/lib/signatures";
import { razorpay, razorpayConfig } from "@/lib/razorpay";
import { confirmPayment } from "@/server/payments";

const bodySchema = z.object({
  razorpay_order_id: z.string().min(1).max(64),
  razorpay_payment_id: z.string().min(1).max(64),
  razorpay_signature: z.string().min(1).max(256),
});

/**
 * Called by the browser after Razorpay Checkout succeeds. The checkout redirect alone
 * is never trusted: we verify the HMAC signature, then fetch the payment from Razorpay
 * to confirm status and amount before confirming the registration.
 */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "GUARDIAN") return NextResponse.json({ error: "Please log in." }, { status: 401 });
  if (!(await rateLimit(`verify-pay:${user.id}`, 30, 600))) {
    return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  }
  const cfg = razorpayConfig();
  if (!cfg.ok) return NextResponse.json({ error: cfg.reason }, { status: 503 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = parsed.data;

  const order = await db.paymentOrder.findUnique({
    where: { razorpayOrderId: orderId },
    include: { registration: { include: { student: { include: { guardian: true } } } } },
  });
  if (!order || order.registration.student.guardian.userId !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!verifyCheckoutSignature({ orderId, paymentId, signature, keySecret: process.env.RAZORPAY_KEY_SECRET! })) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  try {
    let payment = await razorpay().payments.fetch(paymentId);
    if (payment.order_id !== orderId) return NextResponse.json({ error: "Payment does not match order." }, { status: 400 });
    if (payment.status === "authorized") {
      payment = await razorpay().payments.capture(paymentId, Number(payment.amount), payment.currency);
    }
    if (payment.status !== "captured") {
      return NextResponse.json({ status: "pending", message: "Payment is being processed. Your dashboard will update shortly." }, { status: 202 });
    }
    const result = await confirmPayment({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      amountPaise: Number(payment.amount),
      method: payment.method ?? null,
      source: "CHECKOUT_SIGNATURE",
    });
    if (result.status !== "confirmed") {
      return NextResponse.json({ error: "Payment could not be matched to your registration. Please contact support." }, { status: 409 });
    }
    const reg = await db.registration.findUnique({ where: { id: result.registrationId }, select: { registrationNumber: true, status: true } });
    return NextResponse.json({ status: "confirmed", registrationId: result.registrationId, registrationNumber: reg?.registrationNumber });
  } catch (e) {
    console.error("[payments/verify] gateway error", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ status: "pending", message: "We are confirming your payment with the gateway. Please check your dashboard in a few minutes." }, { status: 202 });
  }
}
