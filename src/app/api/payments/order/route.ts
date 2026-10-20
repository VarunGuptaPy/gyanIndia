import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { createOrderForRegistration, PaymentError } from "@/server/payments";
import { SITE } from "@/lib/site";

const bodySchema = z.object({ registrationId: z.string().min(1).max(40) });

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user || user.role !== "GUARDIAN") {
    return NextResponse.json({ error: "Please log in to continue." }, { status: 401 });
  }
  if (!(await rateLimit(`order:${user.id}`, 20, 60 * 10))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  try {
    const { order, keyId, registration } = await createOrderForRegistration(parsed.data.registrationId, user.id);
    const guardian = registration.student.guardian;
    return NextResponse.json({
      keyId,
      orderId: order.razorpayOrderId,
      amount: order.amountPaise,
      currency: order.currency,
      name: SITE.shortName,
      description: `${registration.examination.shortName} registration`,
      prefill: { name: guardian.fullName, email: guardian.email, contact: guardian.mobile },
    });
  } catch (e) {
    if (e instanceof PaymentError) return NextResponse.json({ error: e.message, setupRequired: e.status === 503 }, { status: e.status });
    console.error("[payments/order] failed", e instanceof Error ? e.message : "unknown");
    return NextResponse.json({ error: "We could not start the payment. Please try again." }, { status: 502 });
  }
}
