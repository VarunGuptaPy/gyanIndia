import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD, EmptyRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { can } from "@/lib/rbac";
import { getCurrentExam } from "@/lib/exam";
import { db } from "@/lib/db";
import { formatDateTime, humanize } from "@/lib/format";
import type { ImportRowError, ValidImportRow } from "@/lib/result-import";
import { applyBatchAction, correctResultAction, discardBatchAction, setResultsPublished, uploadResultsAction } from "@/server/actions/admin";

export const metadata = { title: "Results" };

export default async function ResultsAdmin({ searchParams }: { searchParams: Promise<{ subject?: string; q?: string }> }) {
  const user = await requireAdmin("results:manage");
  const exam = await getCurrentExam();
  if (!exam) return null;
  const sp = await searchParams;
  const subjectId = sp.subject ?? exam.subjects[0]?.id;
  const es = exam.subjects.find((s) => s.id === subjectId);

  const [batches, results, totals] = await Promise.all([
    db.resultImportBatch.findMany({ where: { examinationId: exam.id, status: "PENDING_REVIEW" }, include: { examSubject: { include: { subject: true } } }, orderBy: { createdAt: "desc" } }),
    es
      ? db.result.findMany({
          where: { registrationSubject: { examSubjectId: es.id, ...(sp.q ? { registration: { registrationNumber: { contains: sp.q.toUpperCase() } } } : {}) } },
          include: { registrationSubject: { include: { registration: { include: { student: true } } } }, corrections: { orderBy: { createdAt: "desc" }, take: 1 } },
          orderBy: { registrationSubject: { registration: { registrationNumber: "asc" } } },
          take: 100,
        })
      : Promise.resolve([]),
    db.result.groupBy({ by: ["status"], where: { registrationSubject: { registration: { examinationId: exam.id } } }, _count: true }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Results"
        description="Import marks from validated CSV files, review each batch, correct individual results with a logged reason, then publish."
        actions={can(user.role, "results:publish") && (
          <ActionForm action={setResultsPublished} confirm={exam.resultsPublished ? "Unpublish results? Guardians will no longer see them." : "Publish results to all guardians now?"}>
            <input type="hidden" name="examinationId" value={exam.id} />
            <input type="hidden" name="publish" value={exam.resultsPublished ? "false" : "true"} />
            <SubmitButton size="sm" variant={exam.resultsPublished ? "outline" : "primary"}>{exam.resultsPublished ? "Unpublish results" : "Publish results"}</SubmitButton>
          </ActionForm>
        )}
      />
      <div className="mb-6 flex flex-wrap gap-2 text-sm">
        <Badge tone={exam.resultsPublished ? "success" : "warning"} dot>{exam.resultsPublished ? "Published" : "Not published"}</Badge>
        {totals.map((t) => <Badge key={t.status}>{humanize(t.status)}: {t._count}</Badge>)}
      </div>

      {!exam.resultsPublished && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Upload marks (CSV)</CardTitle><p className="text-sm text-muted">Columns: <code>registration_number, marks, status</code>. Status is optional (PRESENT, ABSENT or WITHHELD). Marks up to 2 decimals and not above the subject maximum.</p></CardHeader>
          <CardBody>
            <ActionForm action={uploadResultsAction} resetOnSuccess className="flex flex-wrap items-end gap-3">
              <label className="text-sm"><span className="mb-1 block font-medium">Subject</span>
                <NativeSelect name="examSubjectId" defaultValue={subjectId} className="w-60">
                  {exam.subjects.map((s) => <option key={s.id} value={s.id}>{s.subject.name}{s.maxMarks ? ` (max ${s.maxMarks})` : " — set max marks first"}</option>)}
                </NativeSelect>
              </label>
              <label className="text-sm"><span className="mb-1 block font-medium">CSV file</span><Input type="file" name="file" accept=".csv,text/csv" required className="h-11 py-2" /></label>
              <SubmitButton size="sm" className="h-11">Upload and validate</SubmitButton>
            </ActionForm>
          </CardBody>
        </Card>
      )}

      {batches.map((b) => {
        const valid = b.validRows as unknown as ValidImportRow[];
        const errors = b.errorRows as unknown as ImportRowError[];
        return (
          <Card key={b.id} className="mb-6 border-gold/50">
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Review batch — {b.examSubject.subject.name}</CardTitle>
                <p className="text-sm text-muted">{b.fileName} · {b.rowCount} rows · uploaded {formatDateTime(b.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <ActionForm action={discardBatchAction}><input type="hidden" name="batchId" value={b.id} /><SubmitButton size="sm" variant="ghost">Discard</SubmitButton></ActionForm>
                <ActionForm action={applyBatchAction} confirm={`Apply ${valid.length} result(s)? Existing results for these students will be overwritten.`}>
                  <input type="hidden" name="batchId" value={b.id} />
                  <SubmitButton size="sm" disabled={errors.length > 0}>Apply {valid.length} results</SubmitButton>
                </ActionForm>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex gap-2"><Badge tone="success">{valid.length} valid</Badge><Badge tone={errors.length ? "danger" : "neutral"}>{errors.length} errors</Badge></div>
              {errors.length > 0 && (
                <Table className="min-w-[480px]">
                  <THead><tr><TH>Line</TH><TH>Registration no.</TH><TH>Problem</TH></tr></THead>
                  <tbody>{errors.slice(0, 200).map((e) => <TR key={`${e.line}-${e.registrationNumber}`}><TD>{e.line}</TD><TD className="font-mono text-xs">{e.registrationNumber || "—"}</TD><TD className="text-danger">{e.error}</TD></TR>)}</tbody>
                </Table>
              )}
              {errors.length === 0 && (
                <Table className="min-w-[480px]">
                  <THead><tr><TH>Line</TH><TH>Registration no.</TH><TH>Marks</TH><TH>Status</TH></tr></THead>
                  <tbody>{valid.slice(0, 50).map((r) => <TR key={r.line}><TD>{r.line}</TD><TD className="font-mono text-xs">{r.registrationNumber}</TD><TD>{r.marks ?? "—"}</TD><TD>{humanize(r.status)}</TD></TR>)}</tbody>
                </Table>
              )}
              {errors.length > 0 && <p className="text-sm text-muted">Correct the file and upload it again. Batches with errors cannot be applied.</p>}
            </CardBody>
          </Card>
        );
      })}

      <FilterBar>
        <label className="text-sm"><span className="mb-1 block font-medium">Subject</span>
          <NativeSelect name="subject" defaultValue={subjectId} className="w-60">{exam.subjects.map((s) => <option key={s.id} value={s.id}>{s.subject.name}</option>)}</NativeSelect>
        </label>
        <label className="text-sm"><span className="mb-1 block font-medium">Registration no.</span><Input name="q" defaultValue={sp.q} /></label>
        <Button type="submit" size="sm" className="h-11">Show</Button>
      </FilterBar>
      <Card>
        <Table>
          <THead><tr><TH>Registration</TH><TH>Student</TH><TH>Marks</TH><TH>Status</TH><TH>Correction</TH></tr></THead>
          <tbody>
            {results.length === 0 && <EmptyRow colSpan={5}>No results imported for this subject yet.</EmptyRow>}
            {results.map((r) => (
              <TR key={r.id}>
                <TD className="font-mono text-xs"><Link href={`/admin/registrations/${r.registrationSubject.registrationId}`} className="text-royal">{r.registrationSubject.registration.registrationNumber}</Link></TD>
                <TD>{r.registrationSubject.registration.student.fullName}<span className="block text-xs text-muted">Class {r.registrationSubject.registration.student.classGrade}</span></TD>
                <TD className="tabular-nums">{r.marksObtained ? `${r.marksObtained} / ${r.maxMarks}` : "—"}</TD>
                <TD><Badge>{humanize(r.status)}</Badge>{r.corrections[0] && <span className="block text-xs text-muted">corrected {formatDateTime(r.corrections[0].createdAt)}</span>}</TD>
                <TD>
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-royal">Correct</summary>
                    <ActionForm action={correctResultAction} className="mt-2 flex min-w-72 flex-wrap gap-2">
                      <input type="hidden" name="resultId" value={r.id} />
                      <Input name="marks" defaultValue={r.marksObtained?.toString() ?? ""} placeholder="Marks" className="h-9 w-20" aria-label="Marks" />
                      <NativeSelect name="status" defaultValue={r.status} className="h-9 w-32" aria-label="Status"><option value="PRESENT">Present</option><option value="ABSENT">Absent</option><option value="WITHHELD">Withheld</option></NativeSelect>
                      <Input name="reason" placeholder="Reason (required)" className="h-9 w-48" aria-label="Reason" required />
                      <SubmitButton size="sm">Save</SubmitButton>
                    </ActionForm>
                  </details>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
      {exam.resultsPublished && <Alert tone="info" className="mt-6">Results are published. Bulk imports are disabled; use individual corrections, which are logged with a reason.</Alert>}
    </>
  );
}
