import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { RegistrationStatusBadge } from "@/components/student/status";
import { requireAdmin } from "@/lib/session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { formatPaise } from "@/lib/fees";
import { formatDateTime, humanize } from "@/lib/format";
import { allocateAction } from "@/server/actions/admin";

export const metadata = { title: "Registration" };

export default async function RegistrationDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin("registrations:view");
  const { id } = await params;
  const r = await db.registration.findUnique({
    where: { id },
    include: {
      examination: true,
      student: { include: { guardian: { include: { consents: { orderBy: { acceptedAt: "desc" } } } } } },
      subjects: { include: { examSubject: { include: { subject: true } }, result: true, ranking: true } },
      paymentOrders: { include: { payments: { include: { refunds: true } } }, orderBy: { createdAt: "desc" } },
      allocation: { include: { centre: true } },
      admitCard: true,
      certificates: true,
    },
  });
  if (!r) notFound();
  const centres = can(user.role, "centres:manage")
    ? await db.examinationCentre.findMany({ where: { examinationId: r.examinationId }, include: { _count: { select: { allocations: true } } }, orderBy: { code: "asc" } })
    : [];
  const showGuardian = can(user.role, "students:view");

  return (
    <>
      <AdminPageHeader title={r.registrationNumber ?? `Registration #${r.id.slice(-8)}`} description={<span className="inline-flex items-center gap-2"><RegistrationStatusBadge status={r.status} /> Created {formatDateTime(r.createdAt)}{r.confirmedAt && ` · confirmed ${formatDateTime(r.confirmedAt)}`}</span>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Student</CardTitle></CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[["Name", r.student.fullName], ["Class", r.student.classGrade], ["Board", r.student.board], ["School", r.student.schoolName], ["City", r.student.city], ["State", r.student.state], ["Language", humanize(r.student.examLanguage)]].map(([k, v]) => (
                <div key={String(k)}><dt className="text-muted">{k}</dt><dd className="font-medium text-navy">{v}</dd></div>
              ))}
            </dl>
          </CardBody>
        </Card>
        {showGuardian && (
          <Card>
            <CardHeader><CardTitle>Guardian & consent</CardTitle></CardHeader>
            <CardBody className="space-y-3 text-sm">
              <p className="font-medium text-navy">{r.student.guardian.fullName}</p>
              <p>{r.student.guardian.mobile} · {r.student.guardian.email}</p>
              <ul className="space-y-1 text-xs text-muted">
                {r.student.guardian.consents.map((c) => <li key={c.id}>Consent v{c.consentVersion} accepted {formatDateTime(c.acceptedAt)}{c.withdrawnAt ? ` · withdrawn ${formatDateTime(c.withdrawnAt)}` : ""}</li>)}
              </ul>
            </CardBody>
          </Card>
        )}
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Subjects, results and rankings</CardTitle></CardHeader>
          <Table>
            <THead><tr><TH>Subject</TH><TH>Fee</TH><TH>Result</TH><TH>Rank</TH></tr></THead>
            <tbody>
              {r.subjects.map((s) => (
                <TR key={s.id}>
                  <TD className="font-medium">{s.examSubject.subject.name}</TD>
                  <TD>{formatPaise(s.feePaise)}</TD>
                  <TD>{s.result ? `${s.result.status === "PRESENT" ? `${s.result.marksObtained} / ${s.result.maxMarks}` : humanize(s.result.status)}` : "—"}</TD>
                  <TD>{s.ranking ? `#${s.ranking.rank}${s.ranking.classGrade ? ` (Class ${s.ranking.classGrade})` : ""}` : "—"}</TD>
                </TR>
              ))}
              <TR><TD className="font-semibold">Total (incl. {formatPaise(r.registrationFeePaise)} registration)</TD><TD className="font-semibold">{formatPaise(r.totalPaise)}</TD><TD /><TD /></TR>
            </tbody>
          </Table>
        </Card>
        {can(user.role, "payments:view") && (
          <Card className="xl:col-span-2">
            <CardHeader><CardTitle>Payment orders</CardTitle></CardHeader>
            <Table>
              <THead><tr><TH>Order</TH><TH>Amount</TH><TH>Order status</TH><TH>Payments</TH></tr></THead>
              <tbody>
                {r.paymentOrders.length === 0 && <TR><TD colSpan={4} className="text-muted">No payment attempts yet.</TD></TR>}
                {r.paymentOrders.map((o) => (
                  <TR key={o.id}>
                    <TD className="font-mono text-xs">{o.razorpayOrderId}</TD>
                    <TD>{formatPaise(o.amountPaise)}</TD>
                    <TD><Badge>{o.status}</Badge></TD>
                    <TD className="text-xs">{o.payments.map((p) => <div key={p.id}>{p.razorpayPaymentId} · {p.status} · via {humanize(p.verifiedVia)}{p.refunds.length ? ` · ${p.refunds.length} refund(s)` : ""}</div>)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
        <Card>
          <CardHeader><CardTitle>Centre allocation</CardTitle></CardHeader>
          <CardBody className="space-y-4 text-sm">
            <p>{r.allocation ? <>Allocated to <strong>{r.allocation.centre.name}</strong> ({r.allocation.centre.code})</> : "Not allocated."}</p>
            {r.admitCard && <p>Admit card {r.admitCard.admitCardNumber} · <Badge>{r.admitCard.status}</Badge></p>}
            {r.status === "CONFIRMED" && centres.length > 0 && (
              <ActionForm action={allocateAction} className="flex flex-wrap items-end gap-3">
                <input type="hidden" name="registrationId" value={r.id} />
                <label className="flex-1 text-sm"><span className="mb-1 block font-medium">Allocate / change centre</span>
                  <NativeSelect name="centreId" defaultValue={r.allocation?.centreId ?? ""} required>
                    <option value="" disabled>Select centre</option>
                    {centres.map((c) => <option key={c.id} value={c.id} disabled={!c.isApproved}>{c.code} — {c.name} ({c._count.allocations}/{c.capacity}){c.isApproved ? "" : " · not approved"}</option>)}
                  </NativeSelect>
                </label>
                <SubmitButton size="sm" className="h-11">Save</SubmitButton>
              </ActionForm>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Certificates</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            {r.certificates.length === 0 ? <p className="text-muted">None issued.</p> : r.certificates.map((c) => (
              <p key={c.id}><a href={`/api/certificates/${c.id}`} className="font-mono text-royal underline">{c.certificateNumber}</a> · {humanize(c.type)} · {c.subjectName} · <Badge tone={c.status === "ISSUED" ? "success" : "danger"}>{c.status}</Badge></p>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
