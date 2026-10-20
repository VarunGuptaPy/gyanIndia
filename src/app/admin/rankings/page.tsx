import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD, EmptyRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { getCurrentExam } from "@/lib/exam";
import { db } from "@/lib/db";
import { humanize } from "@/lib/format";
import { rankingsStale } from "@/server/exam-ops";
import { generateRankingsAction, setRankingsPublished } from "@/server/actions/admin";

export const metadata = { title: "Rankings" };

export default async function RankingsAdmin({ searchParams }: { searchParams: Promise<{ subject?: string; cls?: string }> }) {
  await requireAdmin("rankings:manage");
  const exam = await getCurrentExam();
  if (!exam) return null;
  const sp = await searchParams;
  const subjectId = sp.subject ?? exam.subjects[0]?.id;
  const cls = sp.cls ? Number(sp.cls) : undefined;
  const [rows, count, stale] = await Promise.all([
    db.ranking.findMany({
      where: { examSubjectId: subjectId, ...(cls ? { classGrade: cls } : {}) },
      include: { registrationSubject: { include: { registration: { include: { student: true } } } } },
      orderBy: [{ classGrade: "asc" }, { rank: "asc" }],
      take: 200,
    }),
    db.ranking.count({ where: { examinationId: exam.id } }),
    rankingsStale(exam.id),
  ]);
  const rulesReady = exam.rankingScope && exam.tiePolicy && exam.rankingRulesApproved;

  return (
    <>
      <AdminPageHeader
        title="National rankings"
        description="Rankings are calculated from imported results using the officially approved scope and tie policy. Review them here before publishing."
        actions={
          <>
            <ActionForm action={generateRankingsAction} confirm="Recalculate all rankings from the current results?">
              <input type="hidden" name="examinationId" value={exam.id} />
              <SubmitButton size="sm" variant="outline" disabled={!rulesReady || exam.rankingsPublished}>Calculate rankings</SubmitButton>
            </ActionForm>
            <ActionForm action={setRankingsPublished} confirm={exam.rankingsPublished ? "Unpublish rankings?" : "Publish rankings to guardians?"}>
              <input type="hidden" name="examinationId" value={exam.id} />
              <input type="hidden" name="publish" value={exam.rankingsPublished ? "false" : "true"} />
              <SubmitButton size="sm" variant={exam.rankingsPublished ? "outline" : "primary"} disabled={!exam.rankingsPublished && (count === 0 || stale)}>{exam.rankingsPublished ? "Unpublish" : "Publish rankings"}</SubmitButton>
            </ActionForm>
          </>
        }
      />
      <Card className="mb-6">
        <CardHeader><CardTitle>Ranking rules</CardTitle></CardHeader>
        <CardBody className="flex flex-wrap gap-2 text-sm">
          <Badge tone={exam.rankingScope ? "royal" : "warning"}>Scope: {exam.rankingScope ? humanize(exam.rankingScope) : "not decided"}</Badge>
          <Badge tone={exam.tiePolicy ? "royal" : "warning"}>Ties: {exam.tiePolicy ? humanize(exam.tiePolicy) : "not decided"}</Badge>
          <Badge tone={exam.rankingRulesApproved ? "success" : "warning"}>{exam.rankingRulesApproved ? "Officially approved" : "Not approved"}</Badge>
          <Badge tone={exam.rankingsPublished ? "success" : "neutral"}>{exam.rankingsPublished ? "Published" : "Not published"}</Badge>
          {!rulesReady && <Link href="/admin/examinations" className="font-semibold text-royal">Set ranking rules →</Link>}
        </CardBody>
      </Card>
      {stale && <Alert tone="warning" className="mb-6" title="Results changed after rankings were calculated">Recalculate rankings before publishing.</Alert>}

      <FilterBar>
        <label className="text-sm"><span className="mb-1 block font-medium">Subject</span>
          <NativeSelect name="subject" defaultValue={subjectId} className="w-60">{exam.subjects.map((s) => <option key={s.id} value={s.id}>{s.subject.name}</option>)}</NativeSelect>
        </label>
        <label className="text-sm"><span className="mb-1 block font-medium">Class</span>
          <NativeSelect name="cls" defaultValue={sp.cls ?? ""} className="w-36"><option value="">All</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Class {i + 1}</option>)}</NativeSelect>
        </label>
        <Button type="submit" size="sm" className="h-11">Show</Button>
      </FilterBar>
      <Card>
        <Table>
          <THead><tr><TH>Rank</TH><TH>Group</TH><TH>Registration</TH><TH>Student</TH><TH>Marks</TH></tr></THead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={5}>No rankings calculated for this subject.</EmptyRow>}
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="font-display text-lg font-bold text-navy">#{r.rank}</TD>
                <TD>{r.classGrade ? `Class ${r.classGrade}` : "All classes"}</TD>
                <TD className="font-mono text-xs">{r.registrationSubject.registration.registrationNumber}</TD>
                <TD>{r.registrationSubject.registration.student.fullName}</TD>
                <TD className="tabular-nums">{r.marks.toString()}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
