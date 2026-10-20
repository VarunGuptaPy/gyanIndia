import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD, EmptyRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar, Pagination } from "@/components/admin/page-header";
import { RegistrationStatusBadge } from "@/components/student/status";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { formatPaise } from "@/lib/fees";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Registrations" };
const PAGE = 25;

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  await requireAdmin("registrations:view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim();
  const where: Prisma.RegistrationWhereInput = {
    ...(sp.status ? { status: sp.status as "CONFIRMED" } : {}),
    ...(q ? { OR: [{ registrationNumber: { contains: q.toUpperCase() } }, { student: { fullName: { contains: q, mode: "insensitive" } } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.registration.findMany({
      where,
      include: { student: true, subjects: { include: { examSubject: { include: { subject: true } } } }, paymentOrders: { include: { payments: true } }, allocation: { include: { centre: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
    }),
    db.registration.count({ where }),
  ]);
  return (
    <>
      <AdminPageHeader title="Registrations" description="Every registration with its subjects, amount and payment state." />
      <FilterBar>
        <label className="min-w-56 flex-1 text-sm"><span className="mb-1 block font-medium">Search</span><Input name="q" defaultValue={q} placeholder="Registration no. or student name" /></label>
        <label className="w-52 text-sm"><span className="mb-1 block font-medium">Status</span>
          <NativeSelect name="status" defaultValue={sp.status ?? ""}>
            <option value="">All</option><option value="PENDING_PAYMENT">Payment pending</option><option value="CONFIRMED">Confirmed</option><option value="CANCELLED">Cancelled</option><option value="REFUNDED">Refunded</option>
          </NativeSelect>
        </label>
        <Button type="submit" size="sm" className="h-11">Apply</Button>
      </FilterBar>
      <Card>
        <Table>
          <THead><tr><TH>Registration</TH><TH>Student</TH><TH>Subjects</TH><TH>Total</TH><TH>Payment</TH><TH>Centre</TH><TH>Created</TH></tr></THead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={7}>No registrations found.</EmptyRow>}
            {rows.map((r) => {
              const paid = r.paymentOrders.flatMap((o) => o.payments).find((p) => p.status !== "FAILED");
              const failed = r.paymentOrders.flatMap((o) => o.payments).filter((p) => p.status === "FAILED").length;
              return (
                <TR key={r.id}>
                  <TD><Link href={`/admin/registrations/${r.id}`} className="font-mono text-xs font-semibold text-royal hover:underline">{r.registrationNumber ?? `#${r.id.slice(-8)}`}</Link><div className="mt-1"><RegistrationStatusBadge status={r.status} /></div></TD>
                  <TD className="font-medium text-navy">{r.student.fullName}<span className="block text-xs text-muted">Class {r.student.classGrade}</span></TD>
                  <TD className="max-w-60 text-xs">{r.subjects.map((s) => s.examSubject.subject.name).join(", ")}</TD>
                  <TD className="tabular-nums">{formatPaise(r.totalPaise)}</TD>
                  <TD>{paid ? <Badge tone="success">{paid.status.toLowerCase().replace("_", " ")}</Badge> : <Badge>none</Badge>}{failed > 0 && <span className="block text-xs text-danger">{failed} failed attempt(s)</span>}</TD>
                  <TD className="text-xs">{r.allocation?.centre.code ?? "—"}</TD>
                  <TD className="text-xs text-muted">{formatDateTime(r.createdAt)}</TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
        <Pagination page={page} pageSize={PAGE} total={total} params={{ q, status: sp.status }} />
      </Card>
    </>
  );
}
