import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { nextCounter, registrationNumberFor } from "@/lib/counters";
import { razorpay, razorpayConfig } from "@/lib/razorpay";
import { registrationConfirmationEmail, sendEmail } from "@/lib/email";
import { formatPaise } from "@/lib/fees";

export class PaymentError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

/** Recomputes the payable total from stored line items — never from client input. */
export function expectedTotal(reg: { registrationFeePaise: number; subjects: { feePaise: number }[] }) {
  return reg.registrationFeePaise + reg.subjects.reduce((s, x) => s + x.feePaise, 0);
}

/**
 * Creates (or reuses) a Razorpay order for a guardian's pending registration.
 */
export async function createOrderForRegistration(registrationId: string, userId: string) {
  const cfg = razorpayConfig();
  if (!cfg.ok) throw new PaymentError(cfg.reason, 503);

  const reg = await db.registration.findUnique({
    where: { id: registrationId },
    include: {
      subjects: true,
      student: { include: { guardian: true } },
      paymentOrders: { where: { status: "CREATED" }, orderBy: { createdAt: "desc" }, take: 1 },
      examination: true,
    },
  });
  if (!reg || reg.student.guardian.userId !== userId) throw new PaymentError("Registration not found.", 404);
  if (reg.status !== "PENDING_PAYMENT") throw new PaymentError("This registration does not need payment.", 409);

  const amountPaise = expectedTotal(reg);
  if (amountPaise !== reg.totalPaise || amountPaise <= 0) {
    await audit({ action: "payment.amount_integrity_failed", entityType: "Registration", entityId: reg.id });
    throw new PaymentError("We could not verify the amount for this registration. Please contact support.", 409);
  }

  const reusable = reg.paymentOrders[0];
  const fresh = reusable && Date.now() - reusable.createdAt.getTime() < 12 * 60 * 60 * 1000;
  if (reusable && fresh && reusable.amountPaise === amountPaise) {
    return { order: reusable, keyId: cfg.keyId, registration: reg };
  }

  const attempt = (await db.paymentOrder.count({ where: { registrationId: reg.id } })) + 1;
  const receipt = `rg_${reg.id}_${attempt}`.slice(0, 40);
  const rzpOrder = await razorpay().orders.create({
    amount: amountPaise,
    currency: "INR",
    receipt,
    notes: { registrationId: reg.id, exam: reg.examination.slug },
  });

  const order = await db.paymentOrder.create({
    data: {
      registrationId: reg.id,
      razorpayOrderId: rzpOrder.id,
      amountPaise,
      currency: "INR",
      receipt,
    },
  });
  await audit({ actorId: userId, action: "payment.order_created", entityType: "PaymentOrder", entityId: order.id, metadata: { amountPaise } });
  return { order, keyId: cfg.keyId, registration: reg };
}

export type ConfirmResult =
  | { status: "confirmed"; registrationId: string; newlyConfirmed: boolean }
  | { status: "unknown_order" }
  | { status: "amount_mismatch" };

/**
 * Idempotently records a captured payment and confirms the registration.
 * Safe to call concurrently from the checkout callback and the webhook.
 */
export async function confirmPayment(p: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  method?: string | null;
  source: "CHECKOUT_SIGNATURE" | "WEBHOOK";
}): Promise<ConfirmResult> {
  const result = await db.$transaction(
    async (tx): Promise<ConfirmResult> => {
      const order = await tx.paymentOrder.findUnique({
        where: { razorpayOrderId: p.razorpayOrderId },
        include: { registration: { include: { examination: true } } },
      });
      if (!order) return { status: "unknown_order" };

      if (p.amountPaise !== order.amountPaise) {
        await audit(
          {
            action: "payment.amount_mismatch",
            entityType: "PaymentOrder",
            entityId: order.id,
            metadata: { expected: order.amountPaise, received: p.amountPaise, source: p.source },
          },
          tx,
        );
        return { status: "amount_mismatch" };
      }

      // Row-level claim: only one concurrent caller transitions the order to PAID.
      const claimed = await tx.paymentOrder.updateMany({
        where: { id: order.id, status: { not: "PAID" } },
        data: { status: "PAID" },
      });

      const existing = await tx.payment.findUnique({ where: { razorpayPaymentId: p.razorpayPaymentId } });
      if (!existing) {
        await tx.payment.create({
          data: {
            paymentOrderId: order.id,
            razorpayPaymentId: p.razorpayPaymentId,
            amountPaise: p.amountPaise,
            status: "CAPTURED",
            method: p.method ?? null,
            verifiedVia: p.source,
            capturedAt: new Date(),
          },
        });
        if (claimed.count === 0) {
          // A second, different payment against an already-paid order: flag for refund review.
          await audit(
            { action: "payment.duplicate_for_paid_order", entityType: "PaymentOrder", entityId: order.id },
            tx,
          );
        }
      } else if (existing.status === "FAILED") {
        await tx.payment.update({
          where: { id: existing.id },
          data: { status: "CAPTURED", capturedAt: new Date(), errorDescription: null, verifiedVia: p.source },
        });
      }

      const reg = order.registration;
      let newlyConfirmed = false;
      if (reg.status === "PENDING_PAYMENT") {
        const n = await nextCounter(tx, `registration:${reg.examinationId}`);
        const updated = await tx.registration.updateMany({
          where: { id: reg.id, status: "PENDING_PAYMENT" },
          data: {
            status: "CONFIRMED",
            confirmedAt: new Date(),
            registrationNumber: registrationNumberFor(reg.examination.year, n),
          },
        });
        newlyConfirmed = updated.count === 1;
        if (newlyConfirmed) {
          await audit(
            { action: "registration.confirmed", entityType: "Registration", entityId: reg.id, metadata: { source: p.source } },
            tx,
          );
        }
      } else if (reg.status === "CANCELLED") {
        await audit({ action: "payment.received_for_cancelled_registration", entityType: "Registration", entityId: reg.id }, tx);
      }
      return { status: "confirmed", registrationId: reg.id, newlyConfirmed };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15_000 },
  );

  if (result.status === "confirmed" && result.newlyConfirmed) {
    await sendConfirmationEmail(result.registrationId).catch(() => undefined);
  }
  return result;
}

export async function recordFailedPayment(p: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
  method?: string | null;
  errorDescription?: string | null;
}) {
  const order = await db.paymentOrder.findUnique({ where: { razorpayOrderId: p.razorpayOrderId } });
  if (!order) return;
  const existing = await db.payment.findUnique({ where: { razorpayPaymentId: p.razorpayPaymentId } });
  if (existing) return; // never downgrade a captured payment
  await db.payment
    .create({
      data: {
        paymentOrderId: order.id,
        razorpayPaymentId: p.razorpayPaymentId,
        amountPaise: p.amountPaise,
        status: "FAILED",
        method: p.method ?? null,
        errorDescription: p.errorDescription?.slice(0, 300) ?? null,
        verifiedVia: "WEBHOOK",
      },
    })
    .catch((e) => {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
    });
}

export async function recordRefundProcessed(p: { razorpayRefundId: string; razorpayPaymentId: string; amountPaise: number }) {
  const payment = await db.payment.findUnique({
    where: { razorpayPaymentId: p.razorpayPaymentId },
    include: { refunds: true, paymentOrder: true },
  });
  if (!payment) return;
  await db.$transaction(async (tx) => {
    const existing = await tx.refund.findUnique({ where: { razorpayRefundId: p.razorpayRefundId } });
    if (existing) {
      await tx.refund.update({ where: { id: existing.id }, data: { status: "PROCESSED" } });
    } else {
      await tx.refund.create({
        data: {
          paymentId: payment.id,
          razorpayRefundId: p.razorpayRefundId,
          amountPaise: p.amountPaise,
          status: "PROCESSED",
          reason: "Recorded from Razorpay webhook",
        },
      });
    }
    const refunded = await tx.refund.aggregate({
      where: { paymentId: payment.id, status: "PROCESSED" },
      _sum: { amountPaise: true },
    });
    const total = refunded._sum.amountPaise ?? 0;
    const full = total >= payment.amountPaise;
    await tx.payment.update({ where: { id: payment.id }, data: { status: full ? "REFUNDED" : "PARTIALLY_REFUNDED" } });
    if (full) {
      await tx.registration.update({ where: { id: payment.paymentOrder.registrationId }, data: { status: "REFUNDED" } });
    }
  });
}

async function sendConfirmationEmail(registrationId: string) {
  const reg = await db.registration.findUnique({
    where: { id: registrationId },
    include: {
      examination: true,
      student: { include: { guardian: true } },
      subjects: { include: { examSubject: { include: { subject: true } } } },
    },
  });
  if (!reg?.registrationNumber) return;
  const mail = registrationConfirmationEmail({
    guardianName: reg.student.guardian.fullName,
    studentFirstName: reg.student.fullName.split(" ")[0],
    registrationNumber: reg.registrationNumber,
    examName: reg.examination.name,
    subjects: reg.subjects.map((s) => s.examSubject.subject.name),
    totalFormatted: formatPaise(reg.totalPaise),
  });
  await sendEmail({ to: reg.student.guardian.email, ...mail });
}
