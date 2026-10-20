import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Table, THead, TH, TR, TD, EmptyRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar, Pagination, StatCard } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { paymentsConfigured } from "@/lib/exam";
import { formatPaise } from "@/lib/fees";
import { formatDateTime, humanize } from "@/lib/format";
import { refundPaymentAction } from "@/server/actions/admin";

export const metadata = { title: "Payments" };
const PAGE = 25;

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  const user = await requireAdmin("payments:view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.PaymentWhereInput = {
    ...(sp.status ? { status: sp.status as "CAPTURED" } : {}),
    ...(sp.q ? { OR: [{ razorpayPaymentId: { contains: sp.q } }, { paymentOrder: { registration: { registrationNumber: { contains: sp.q.toUpperCase() } } } }] } : {}),
  };
  const [rows, total, captured, failed, refunds] = await Promise.all([
    db.payment.findMany({ where, include: { paymentOrder: { include: { registration: true } }, refunds: true }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.payment.count({ where }),
    db.payment.aggregate({ where: { status: { in: ["CAPTURED", "PARTIALLY_REFUNDED", "REFUNDED"] } }, _sum: { amountPaise: true }, _count: true }),
    db.payment.count({ where: { status: "FAILED" } }),
    db.refund.aggregate({ where: { status: "PROCESSED" }, _sum: { amountPaise: true }, _count: true }),
  ]);
  const canRefund = can(user.role, "payments:refund") && paymentsConfigured();

  return (
    <>
      <AdminPageHeader title="Payments" description="Only payments verified with Razorpay (checkout signature or signed webhook) appear here." />
      {!paymentsConfigured() && <Alert tone="warning" className="mb-6" title="Razorpay is not configured">Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET to accept payments. See README.</Alert>}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard tone="navy" label="Verified payments" value={formatPaise(captured._sum.amountPaise ?? 0)} hint={`${captured._count} payment(s)`} />
        <StatCard label="Failed attempts" value={failed} />
        <StatCard label="Refunded" value={formatPaise(refunds._sum.amountPaise ?? 0)} hint={`${refunds._count} processed refund(s)`} />
      </div>
      <FilterBar>
        <label className="min-w-56 flex-1 text-sm"><span className="mb-1 block font-medium">Search</span><Input name="q" defaultValue={sp.q} placeholder="Payment ID or registration no." /></label>
        <label className="w-52 text-sm"><span className="mb-1 block font-medium">Status</span>
          <NativeSelect name="status" defaultValue={sp.status ?? ""}><option value="">All</option>{["CAPTURED", "FAILED", "PARTIALLY_REFUNDED", "REFUNDED"].map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</NativeSelect>
        </label>
        <Button type="submit" size="sm" className="h-11">Apply</Button>
      </FilterBar>
      <Card>
        <Table>
          <THead><tr><TH>Payment</TH><TH>Registration</TH><TH>Amount</TH><TH>Status</TH><TH>Verified via</TH><TH>Date</TH>{canRefund && <TH>Refund</TH>}</tr></THead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={7}>No payments yet.</EmptyRow>}
            {rows.map((p) => {
              const refunded = p.refunds.filter((r) => r.status !== "FAILED").reduce((s, r) => s + r.amountPaise, 0);
              return (
                <TR key={p.id}>
                  <TD className="font-mono text-xs">{p.razorpayPaymentId}<span className="block text-muted">{p.method ?? ""}</span></TD>
                  <TD><Link className="font-mono text-xs text-royal" href={`/admin/registrations/${p.paymentOrder.registrationId}`}>{p.paymentOrder.registration.registrationNumber ?? "pending"}</Link></TD>
                  <TD className="tabular-nums">{formatPaise(p.amountPaise)}{refunded > 0 && <span className="block text-xs text-muted">−{formatPaise(refunded)} refunded</span>}</TD>
                  <TD><Badge tone={p.status === "CAPTURED" ? "success" : p.status === "FAILED" ? "danger" : "neutral"}>{humanize(p.status)}</Badge>{p.errorDescription && <span className="block max-w-48 text-xs text-muted">{p.errorDescription}</span>}</TD>
                  <TD className="text-xs">{humanize(p.verifiedVia)}</TD>
                  <TD className="text-xs text-muted">{formatDateTime(p.capturedAt ?? p.createdAt)}</TD>
                  {canRefund && (
                    <TD>
                      {(p.status === "CAPTURED" || p.status === "PARTIALLY_REFUNDED") && (
                        <ActionForm action={refundPaymentAction} confirm="Initiate this refund through Razorpay? This moves real money in live mode." className="flex min-w-64 flex-wrap gap-2">
                          <input type="hidden" name="paymentId" value={p.id} />
                          <Input name="amount" placeholder="₹" defaultValue={((p.amountPaise - refunded) / 100).toString()} className="h-9 w-20" aria-label="Refund amount in rupees" />
                          <Input name="reason" placeholder="Reason" className="h-9 w-32" aria-label="Refund reason" required />
                          <SubmitButton size="sm" variant="outline">Refund</SubmitButton>
                        </ActionForm>
                      )}
                    </TD>
                  )}
                </TR>
              );
            })}
          </tbody>
        </Table>
        <Pagination page={page} pageSize={PAGE} total={total} params={{ q: sp.q, status: sp.status }} />
      </Card>
    </>
  );
}
