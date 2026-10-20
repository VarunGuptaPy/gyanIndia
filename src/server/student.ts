import "server-only";
import { db } from "@/lib/db";

/** All registrations belonging to a guardian, with everything the dashboard needs. */
export async function guardianRegistrations(guardianId: string) {
  return db.registration.findMany({
    where: { student: { guardianId }, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: {
      examination: true,
      student: true,
      subjects: {
        include: {
          examSubject: { include: { subject: true } },
          result: true,
          ranking: true,
        },
        orderBy: { examSubject: { subject: { sortOrder: "asc" } } },
      },
      paymentOrders: { include: { payments: true }, orderBy: { createdAt: "desc" } },
      admitCard: true,
      allocation: { include: { centre: true } },
      certificates: { where: { status: "ISSUED" }, orderBy: { issuedAt: "desc" } },
    },
  });
}

export type GuardianRegistration = Awaited<ReturnType<typeof guardianRegistrations>>[number];

/** Loads a registration only if it belongs to the given guardian user. */
export async function ownedRegistration(registrationId: string, userId: string) {
  const reg = await db.registration.findUnique({
    where: { id: registrationId },
    include: {
      examination: true,
      student: { include: { guardian: true } },
      subjects: { include: { examSubject: { include: { subject: true } } }, orderBy: { examSubject: { subject: { sortOrder: "asc" } } } },
      paymentOrders: { include: { payments: true } },
      admitCard: true,
    },
  });
  if (!reg || reg.student.guardian.userId !== userId) return null;
  return reg;
}

export function capturedPayment(reg: { paymentOrders: { razorpayOrderId: string; payments: { status: string; razorpayPaymentId: string; method: string | null; capturedAt: Date | null; amountPaise: number }[] }[] }) {
  for (const o of reg.paymentOrders) {
    const p = o.payments.find((x) => x.status === "CAPTURED" || x.status === "PARTIALLY_REFUNDED" || x.status === "REFUNDED");
    if (p) return { ...p, orderId: o.razorpayOrderId };
  }
  return null;
}
