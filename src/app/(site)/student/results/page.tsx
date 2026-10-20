import { Award } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { requireGuardian } from "@/lib/session";
import { guardianRegistrations } from "@/server/student";

export const metadata = { title: "Results" };

export default async function StudentResultsPage() {
  const { guardian } = await requireGuardian("/student/results");
  const regs = (await guardianRegistrations(guardian.id)).filter((r) => r.status === "CONFIRMED");
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Results</h2>
      {regs.length === 0 && (
        <Card><CardBody className="py-14 text-center text-muted"><Award className="mx-auto mb-4 size-10" aria-hidden />Results appear here for confirmed registrations once published.</CardBody></Card>
      )}
      {regs.map((r) => (
        <Card key={r.id}>
          <CardHeader>
            <CardTitle>{r.student.fullName}</CardTitle>
            <p className="text-sm text-muted">{r.registrationNumber} · Class {r.student.classGrade} · {r.examination.shortName}</p>
          </CardHeader>
          {!r.examination.resultsPublished ? (
            <CardBody><p className="text-muted">Results have not been published yet. We will notify you when they are available.</p></CardBody>
          ) : (
            <Table className="min-w-[560px]">
              <THead><tr><TH>Subject</TH><TH>Marks</TH><TH>Maximum</TH><TH>Percentage</TH><TH>National rank</TH><TH>Status</TH></tr></THead>
              <tbody>
                {r.subjects.map((s) => {
                  const res = s.result;
                  const marks = res?.marksObtained ? Number(res.marksObtained) : null;
                  return (
                    <TR key={s.id}>
                      <TD className="font-semibold text-navy">{s.examSubject.subject.name}</TD>
                      <TD>{res?.status === "PRESENT" && marks !== null ? marks : "—"}</TD>
                      <TD>{res?.maxMarks ?? "—"}</TD>
                      <TD>{res?.status === "PRESENT" && marks !== null ? `${((marks / res.maxMarks) * 100).toFixed(2)}%` : "—"}</TD>
                      <TD>
                        {r.examination.rankingsPublished && s.ranking
                          ? <span className="font-bold text-gold-700">#{s.ranking.rank}{s.ranking.classGrade ? ` (Class ${s.ranking.classGrade})` : ""}</span>
                          : r.examination.rankingsPublished ? "—" : "Not yet published"}
                      </TD>
                      <TD>
                        {!res ? <Badge>Awaited</Badge> : res.status === "PRESENT" ? <Badge tone="success">Declared</Badge> : res.status === "ABSENT" ? <Badge tone="warning">Absent</Badge> : <Badge tone="danger">Withheld</Badge>}
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      ))}
    </div>
  );
}
