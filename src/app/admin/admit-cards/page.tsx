import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Table, THead, TH, TR, TD, EmptyRow } from "@/components/ui/table";
import { AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { getCurrentExam } from "@/lib/exam";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { generateAdmitCardsAction, reissueAdmitCardAction, releaseAdmitCardsAction, revokeAdmitCardAction } from "@/server/actions/admin";

export const metadata = { title: "Admit Cards" };

export default async function AdmitCardsAdmin() {
  await requireAdmin("admitcards:manage");
  const exam = await getCurrentExam();
  if (!exam) return null;
  const [confirmed, allocated, byStatus, cards] = await Promise.all([
    db.registration.count({ where: { examinationId: exam.id, status: "CONFIRMED" } }),
    db.centreAllocation.count({ where: { registration: { examinationId: exam.id, status: "CONFIRMED" } } }),
    db.admitCard.groupBy({ by: ["status"], where: { registration: { examinationId: exam.id } }, _count: true }),
    db.admitCard.findMany({ where: { registration: { examinationId: exam.id } }, include: { registration: { include: { student: true } } }, orderBy: { generatedAt: "desc" }, take: 100 }),
  ]);
  const n = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const blockers = [
    !exam.examDate && "Examination date is not set.",
    !exam.examDayInstructions && "Examination-day instructions are not set (required to release).",
    allocated < confirmed && `${confirmed - allocated} confirmed registration(s) have no centre.`,
  ].filter(Boolean) as string[];

  return (
    <>
      <AdminPageHeader
        title="Admit cards"
        description="Generate admit cards for allocated students at approved centres, review them, then release them to guardians."
        actions={
          <>
            <ActionForm action={generateAdmitCardsAction}><input type="hidden" name="examinationId" value={exam.id} /><SubmitButton size="sm" variant="outline">Generate admit cards</SubmitButton></ActionForm>
            <ActionForm action={releaseAdmitCardsAction} confirm="Release all generated admit cards to guardians? They will be able to download them immediately.">
              <input type="hidden" name="examinationId" value={exam.id} /><SubmitButton size="sm">Release generated cards</SubmitButton>
            </ActionForm>
          </>
        }
      />
      {blockers.length > 0 && (
        <Alert tone="warning" className="mb-6" title="Before admit cards can be finalised">
          <ul className="list-disc pl-5">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
        </Alert>
      )}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Confirmed" value={confirmed} />
        <StatCard label="Generated (unreleased)" value={n("GENERATED")} />
        <StatCard tone="navy" label="Released" value={n("RELEASED")} />
        <StatCard label="Revoked" value={n("REVOKED")} />
      </div>
      <Card>
        <Table>
          <THead><tr><TH>Admit card</TH><TH>Student</TH><TH>Centre</TH><TH>Reporting</TH><TH>Status</TH><TH>Action</TH></tr></THead>
          <tbody>
            {cards.length === 0 && <EmptyRow colSpan={6}>No admit cards generated yet.</EmptyRow>}
            {cards.map((c) => (
              <TR key={c.id}>
                <TD className="font-mono text-xs">{c.admitCardNumber}<span className="block text-muted">{formatDateTime(c.generatedAt)}</span></TD>
                <TD><Link href={`/admin/registrations/${c.registrationId}`} className="font-medium text-royal">{c.registration.student.fullName}</Link><span className="block font-mono text-xs text-muted">{c.registration.registrationNumber}</span></TD>
                <TD className="max-w-56 text-xs">{c.centreName}</TD>
                <TD className="text-xs">{c.reportingTime}</TD>
                <TD><Badge tone={c.status === "RELEASED" ? "success" : c.status === "REVOKED" ? "danger" : "neutral"}>{c.status}</Badge></TD>
                <TD>
                  {c.status !== "REVOKED" ? (
                    <ActionForm action={revokeAdmitCardAction} confirm="Revoke this admit card? The guardian will no longer be able to download it."><input type="hidden" name="id" value={c.id} /><SubmitButton size="sm" variant="ghost">Revoke</SubmitButton></ActionForm>
                  ) : (
                    <ActionForm action={reissueAdmitCardAction}><input type="hidden" name="id" value={c.id} /><SubmitButton size="sm" variant="ghost">Prepare reissue</SubmitButton></ActionForm>
                  )}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
