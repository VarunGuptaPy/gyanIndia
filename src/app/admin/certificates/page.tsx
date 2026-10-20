import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD, EmptyRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { getCurrentExam } from "@/lib/exam";
import { db } from "@/lib/db";
import { formatDate, humanize } from "@/lib/format";
import { issueCertificatesAction, revokeCertificateAction } from "@/server/actions/admin";

export const metadata = { title: "Certificates" };

export default async function CertificatesAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireAdmin("certificates:manage");
  const exam = await getCurrentExam();
  if (!exam) return null;
  const { q } = await searchParams;
  const certs = await db.certificate.findMany({
    where: q ? { OR: [{ certificateNumber: { contains: q.toUpperCase() } }, { studentName: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { issuedAt: "desc" },
    take: 100,
  });
  return (
    <>
      <AdminPageHeader title="Certificates" description="Issue certificates in bulk from published results and rankings, download them, and revoke any issued in error. Every certificate can be verified publicly by its number." />
      <Card className="mb-6">
        <CardHeader><CardTitle>Issue certificates</CardTitle><p className="text-sm text-muted">Participation certificates go to every student marked present in the subject. Merit and national-rank certificates go to students at or above the rank you enter (requires published rankings).</p></CardHeader>
        <CardBody>
          <ActionForm action={issueCertificatesAction} confirm="Issue these certificates? Guardians will be able to download them." className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="examinationId" value={exam.id} />
            <label className="text-sm"><span className="mb-1 block font-medium">Subject</span><NativeSelect name="examSubjectId" className="w-56">{exam.subjects.map((s) => <option key={s.id} value={s.id}>{s.subject.name}</option>)}</NativeSelect></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Type</span>
              <NativeSelect name="type" className="w-56"><option value="PARTICIPATION">Participation</option><option value="MERIT">Merit</option><option value="NATIONAL_RANK">National rank</option></NativeSelect>
            </label>
            <label className="text-sm"><span className="mb-1 block font-medium">Up to rank</span><Input name="maxRank" type="number" min={1} className="w-28" placeholder="e.g. 3" /></label>
            <SubmitButton size="sm" className="h-11" disabled={!exam.resultsPublished}>Issue</SubmitButton>
          </ActionForm>
          {!exam.resultsPublished && <p className="mt-3 text-sm text-warning">Results must be published before certificates can be issued.</p>}
        </CardBody>
      </Card>
      <FilterBar>
        <label className="min-w-56 flex-1 text-sm"><span className="mb-1 block font-medium">Search</span><Input name="q" defaultValue={q} placeholder="Certificate number or student name" /></label>
        <Button type="submit" size="sm" className="h-11">Search</Button>
      </FilterBar>
      <Card>
        <Table>
          <THead><tr><TH>Certificate</TH><TH>Student</TH><TH>Type</TH><TH>Subject / rank</TH><TH>Status</TH><TH>Revoke</TH></tr></THead>
          <tbody>
            {certs.length === 0 && <EmptyRow colSpan={6}>No certificates issued yet.</EmptyRow>}
            {certs.map((c) => (
              <TR key={c.id}>
                <TD><a href={`/api/certificates/${c.id}`} className="font-mono text-xs text-royal underline">{c.certificateNumber}</a><span className="block text-xs text-muted">{formatDate(c.issuedAt)}</span></TD>
                <TD><Link href={`/admin/registrations/${c.registrationId}`} className="font-medium">{c.studentName}</Link></TD>
                <TD>{humanize(c.type)}</TD>
                <TD>{c.subjectName}{c.rank ? ` · #${c.rank}` : ""}</TD>
                <TD><Badge tone={c.status === "ISSUED" ? "success" : "danger"}>{c.status}</Badge>{c.revokedReason && <span className="block max-w-40 text-xs text-muted">{c.revokedReason}</span>}</TD>
                <TD>
                  {c.status === "ISSUED" && (
                    <ActionForm action={revokeCertificateAction} confirm="Revoke this certificate? Public verification will show it as revoked." className="flex gap-2">
                      <input type="hidden" name="id" value={c.id} />
                      <Input name="reason" placeholder="Reason" className="h-9 w-36" aria-label="Reason" required />
                      <SubmitButton size="sm" variant="ghost">Revoke</SubmitButton>
                    </ActionForm>
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
