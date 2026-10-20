import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { SubjectIcon } from "@/components/site/subject-icon";
import { requireAdmin } from "@/lib/session";
import { getCurrentExam } from "@/lib/exam";
import { db } from "@/lib/db";
import { updateExamSubject } from "@/server/actions/admin";

export const metadata = { title: "Subjects" };

export default async function SubjectsAdmin() {
  await requireAdmin("subjects:manage");
  const exam = await getCurrentExam();
  if (!exam) return null;
  const counts = await db.registrationSubject.groupBy({ by: ["examSubjectId"], where: { registration: { examinationId: exam.id, status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } } }, _count: true });
  return (
    <>
      <AdminPageHeader title="Subjects" description="Availability, fees and maximum marks for each subject. Fee changes apply only to new registrations — existing registrations keep the price shown at the time." />
      <div className="space-y-3">
        {exam.subjects.map((s) => (
          <Card key={s.id} className="p-5">
            <ActionForm action={updateExamSubject} className="grid items-end gap-4 md:grid-cols-[1.4fr_8rem_8rem_auto_auto]">
              <input type="hidden" name="id" value={s.id} />
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-navy text-gold"><SubjectIcon icon={s.subject.icon} className="size-5" /></span>
                <div><p className="font-bold text-navy">{s.subject.name}</p><p className="text-xs text-muted">{counts.find((c) => c.examSubjectId === s.id)?._count ?? 0} registrations</p></div>
              </div>
              <label className="text-sm"><span className="mb-1 block font-medium">Fee (₹)</span><Input name="fee" inputMode="decimal" defaultValue={(s.feePaise / 100).toString()} /></label>
              <label className="text-sm"><span className="mb-1 block font-medium">Max marks</span><Input name="maxMarks" type="number" min={1} defaultValue={s.maxMarks ?? ""} placeholder="TBA" /></label>
              <div className="flex flex-col gap-1.5 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="isAvailable" defaultChecked={s.isAvailable} className="size-4 accent-[#174EA6]" /> Available</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="isApproved" defaultChecked={s.isApproved} className="size-4 accent-[#174EA6]" /> Officially approved</label>
              </div>
              <SubmitButton size="sm" className="h-11">Save</SubmitButton>
            </ActionForm>
          </Card>
        ))}
      </div>
    </>
  );
}
