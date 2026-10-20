import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getCurrentExam, paymentsConfigured } from "@/lib/exam";
import { emailConfigured } from "@/lib/email";
import { formatPaise } from "@/lib/fees";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Overview" };

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireAdmin("dashboard:view");
  const { denied } = await searchParams;
  const exam = await getCurrentExam();
  if (!exam) return <Alert tone="danger" title="No examination configured">Run the database seed to create NTHE 2026.</Alert>;
  const showFinance = can(user.role, "payments:view") || can(user.role, "registrations:view");

  const [confirmed, pending, revenue, schools, approvedSchools, allocated, newEnquiries, subjectCounts, recent, admitReleased] = await Promise.all([
    db.registration.count({ where: { examinationId: exam.id, status: "CONFIRMED" } }),
    db.registration.count({ where: { examinationId: exam.id, status: "PENDING_PAYMENT" } }),
    db.payment.aggregate({ where: { status: { in: ["CAPTURED", "PARTIALLY_REFUNDED"] }, paymentOrder: { registration: { examinationId: exam.id } } }, _sum: { amountPaise: true }, _count: true }),
    db.schoolPartnership.count(),
    db.school.count({ where: { isOfficialPartner: true } }),
    db.centreAllocation.count({ where: { registration: { examinationId: exam.id, status: "CONFIRMED" } } }),
    db.enquiry.count({ where: { status: "NEW" } }),
    db.registrationSubject.groupBy({ by: ["examSubjectId"], where: { registration: { examinationId: exam.id, status: "CONFIRMED" } }, _count: true }),
    can(user.role, "audit:view") ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { actor: { select: { name: true } } } }) : Promise.resolve([]),
    db.admitCard.count({ where: { status: "RELEASED", registration: { examinationId: exam.id } } }),
  ]);
  const refunded = await db.refund.aggregate({ where: { status: "PROCESSED" }, _sum: { amountPaise: true } });
  const countFor = (id: string) => subjectCounts.find((s) => s.examSubjectId === id)?._count ?? 0;
  const maxCount = Math.max(1, ...exam.subjects.map((s) => countFor(s.id)));

  return (
    <>
      <AdminPageHeader title="Overview" description={`${exam.name} — live figures from the database.`} />
      {denied && <Alert tone="warning" className="mb-6">You do not have permission to open that section.</Alert>}

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <SetupItem ok={exam.registrationOpen} label="Registration" okText="Open" badText="Closed" href="/admin/examinations" />
        <SetupItem ok={paymentsConfigured()} label="Online payments" okText="Configured" badText="Not configured" />
        <SetupItem ok={emailConfigured()} label="Transactional email" okText="Configured" badText="Not configured" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard tone="navy" label="Confirmed registrations" value={confirmed.toLocaleString("en-IN")} hint="Payment verified" />
        <StatCard label="Pending registrations" value={pending.toLocaleString("en-IN")} hint="Awaiting payment" />
        {showFinance && <StatCard tone="gold" label="Registration revenue" value={formatPaise((revenue._sum.amountPaise ?? 0) - (refunded._sum.amountPaise ?? 0))} hint={`${revenue._count} verified payment(s), net of refunds`} />}
        <StatCard label="Participating schools" value={approvedSchools} hint={`${schools} partnership enquiries`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Subject-wise confirmed registrations</CardTitle></CardHeader>
          <CardBody className="space-y-3">
            {exam.subjects.map((s) => {
              const n = countFor(s.id);
              return (
                <div key={s.id} className="grid grid-cols-[10rem_1fr_3rem] items-center gap-3 text-sm">
                  <span className="truncate font-medium text-navy">{s.subject.name}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-paper"><span className="block h-full rounded-full bg-royal" style={{ width: `${(n / maxCount) * 100}%` }} /></span>
                  <span className="text-right tabular-nums">{n}</span>
                </div>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Examination status</CardTitle></CardHeader>
          <CardBody className="space-y-3 text-sm">
            <StatusRow label="Centre allocation" value={`${allocated} / ${confirmed} allocated`} ok={confirmed > 0 && allocated === confirmed} />
            <StatusRow label="Admit cards" value={exam.admitCardsReleased ? `${admitReleased} released` : "Not released"} ok={exam.admitCardsReleased} />
            <StatusRow label="Results" value={exam.resultsPublished ? "Published" : "Not published"} ok={exam.resultsPublished} />
            <StatusRow label="Rankings" value={exam.rankingsPublished ? "Published" : exam.rankingRulesApproved ? "Rules approved" : "Rules not approved"} ok={exam.rankingsPublished} />
            <StatusRow label="New enquiries" value={String(newEnquiries)} ok={newEnquiries === 0} />
          </CardBody>
        </Card>
      </div>

      {recent.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Recent activity</CardTitle><Link href="/admin/audit-logs" className="text-sm font-semibold text-royal">All logs</Link></CardHeader>
          <ul className="divide-y divide-line">
            {recent.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm">
                <span><code className="rounded bg-paper px-1.5 py-0.5 text-xs">{l.action}</code> <span className="text-muted">by {l.actor?.name ?? "system / public"}</span></span>
                <span className="text-xs text-muted">{formatDateTime(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

function SetupItem({ ok, label, okText, badText, href }: { ok: boolean; label: string; okText: string; badText: string; href?: string }) {
  const body = (
    <div className="flex items-center justify-between rounded-xl border border-line bg-white px-4 py-3 text-sm">
      <span className="font-medium text-navy">{label}</span>
      <Badge tone={ok ? "success" : "warning"} dot>{ok ? okText : badText}</Badge>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{label}</span>
      <Badge tone={ok ? "success" : "neutral"}>{value}</Badge>
    </div>
  );
}
