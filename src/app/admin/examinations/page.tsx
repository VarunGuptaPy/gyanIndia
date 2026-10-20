import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { getCurrentExam, paymentsConfigured } from "@/lib/exam";
import { setRegistrationOpen, updateExamination } from "@/server/actions/admin";

export const metadata = { title: "Examination" };

const toInput = (d: Date | null) => (d ? new Date(d.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10) : "");

function F({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-navy">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
function Check({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-[#174EA6]" /> {label}</label>
  );
}

export default async function ExaminationsAdmin() {
  await requireAdmin("exams:manage");
  const exam = await getCurrentExam();
  if (!exam) return <Alert tone="danger">No examination configured.</Alert>;

  return (
    <>
      <AdminPageHeader title={exam.name} description="Official examination details and policies. Leave unconfirmed fields empty — the website shows “To Be Announced”." />

      <Card className="mb-6">
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 font-semibold text-navy">Registration <Badge tone={exam.registrationOpen ? "success" : "warning"} dot>{exam.registrationOpen ? "Open" : "Closed"}</Badge></p>
            <p className="mt-1 text-sm text-muted">
              {paymentsConfigured() ? "Online payments are configured." : "Online payments are not configured — guardians can register but cannot pay yet."}
            </p>
          </div>
          <ActionForm action={setRegistrationOpen} confirm={exam.registrationOpen ? "Close registration? New registrations will be blocked." : "Open registration to the public? Ensure policies, fees and payments are approved."}>
            <input type="hidden" name="id" value={exam.id} />
            <input type="hidden" name="open" value={exam.registrationOpen ? "false" : "true"} />
            <SubmitButton variant={exam.registrationOpen ? "outline" : "primary"}>{exam.registrationOpen ? "Close registration" : "Open registration"}</SubmitButton>
          </ActionForm>
        </CardBody>
      </Card>

      <ActionForm action={updateExamination} className="space-y-6">
        <input type="hidden" name="id" value={exam.id} />
        <Card>
          <CardHeader><CardTitle>Confirmed details</CardTitle></CardHeader>
          <CardBody className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <F label="Examination name"><Input name="name" defaultValue={exam.name} /></F>
            <F label="Examination date"><Input type="date" name="examDate" defaultValue={toInput(exam.examDate)} /></F>
            <F label="Mode"><Input name="mode" defaultValue={exam.mode} /></F>
            <F label="Registration fee (₹)" hint="One-time fee. Applies to new registrations only."><Input name="registrationFee" inputMode="decimal" defaultValue={(exam.registrationFeePaise / 100).toString()} /></F>
            <div className="text-sm">
              <span className="mb-1 block font-semibold text-navy">Languages</span>
              <div className="flex gap-4 pt-2">
                {["English", "Hindi"].map((l) => <label key={l} className="flex items-center gap-2"><input type="checkbox" name="languages" value={l} defaultChecked={exam.languages.includes(l)} className="size-4 accent-[#174EA6]" /> {l}</label>)}
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Eligibility and boards</CardTitle></CardHeader>
          <CardBody className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <F label="Lowest class"><Input type="number" name="eligibleClassMin" min={1} max={12} defaultValue={exam.eligibleClassMin} /></F>
            <F label="Highest class"><Input type="number" name="eligibleClassMax" min={1} max={12} defaultValue={exam.eligibleClassMax} /></F>
            <F label="Boards" hint="Comma-separated"><Input name="boards" defaultValue={exam.boards.join(", ")} /></F>
            <div className="space-y-2 pt-6">
              <Check name="eligibilityApproved" label="Eligibility officially approved" defaultChecked={exam.eligibilityApproved} />
              <Check name="boardsApproved" label="Boards officially approved" defaultChecked={exam.boardsApproved} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Policies pending confirmation</CardTitle><p className="text-sm text-muted">Empty fields display as “To Be Announced” on the website.</p></CardHeader>
          <CardBody className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <F label="Duration (minutes)"><Input type="number" name="durationMinutes" min={1} defaultValue={exam.durationMinutes ?? ""} /></F>
            <F label="Number of questions"><Input type="number" name="questionCount" min={1} defaultValue={exam.questionCount ?? ""} /></F>
            <F label="Marking scheme"><Input name="markingScheme" defaultValue={exam.markingScheme ?? ""} /></F>
            <F label="Negative marking"><Input name="negativeMarking" defaultValue={exam.negativeMarking ?? ""} placeholder="e.g. No negative marking" /></F>
            <F label="Registration deadline"><Input type="date" name="registrationDeadline" defaultValue={toInput(exam.registrationDeadline)} /></F>
            <F label="Result date"><Input type="date" name="resultDate" defaultValue={toInput(exam.resultDate)} /></F>
            <F label="Default reporting time" hint="Used when a centre has no specific time"><Input name="defaultReportingTime" defaultValue={exam.defaultReportingTime ?? ""} placeholder="e.g. 9:00 AM" /></F>
            <div className="md:col-span-2 xl:col-span-3">
              <F label="Examination-day instructions" hint="One instruction per line. Required before admit cards can be released; printed on admit cards and shown on the NTHE page.">
                <Textarea name="examDayInstructions" rows={6} defaultValue={exam.examDayInstructions ?? ""} />
              </F>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ranking rules</CardTitle><p className="text-sm text-muted">Rankings cannot be calculated until these rules are set and marked officially approved. No criteria-based tie-break is available because none has been approved — equal marks always share a rank.</p></CardHeader>
          <CardBody className="grid gap-5 md:grid-cols-3">
            <F label="Ranking scope">
              <NativeSelect name="rankingScope" defaultValue={exam.rankingScope ?? ""}>
                <option value="">Not decided</option>
                <option value="SUBJECT_AND_CLASS">Per subject, within each class</option>
                <option value="SUBJECT_ONLY">Per subject, across all classes</option>
              </NativeSelect>
            </F>
            <F label="Treatment of equal marks">
              <NativeSelect name="tiePolicy" defaultValue={exam.tiePolicy ?? ""}>
                <option value="">Not decided</option>
                <option value="SHARED_COMPETITION">Shared rank, next rank skipped (1, 2, 2, 4)</option>
                <option value="SHARED_DENSE">Shared rank, no gap (1, 2, 2, 3)</option>
              </NativeSelect>
            </F>
            <div className="pt-7"><Check name="rankingRulesApproved" label="These rules are officially approved" defaultChecked={exam.rankingRulesApproved} /></div>
          </CardBody>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <SubmitButton size="lg" className="shadow-lift">Save examination settings</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
