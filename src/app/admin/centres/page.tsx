import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, StatCard } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { getCurrentExam } from "@/lib/exam";
import { db } from "@/lib/db";
import { INDIAN_STATES } from "@/lib/site";
import { autoAllocateAction, saveCentre } from "@/server/actions/admin";
import type { ExaminationCentre } from "@prisma/client";

export const metadata = { title: "Centres" };

function CentreFields({ c }: { c?: ExaminationCentre }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <label className="text-sm"><span className="mb-1 block font-medium">Code</span><Input name="code" defaultValue={c?.code} required placeholder="LKO-01" /></label>
      <label className="text-sm md:col-span-3"><span className="mb-1 block font-medium">Centre name</span><Input name="name" defaultValue={c?.name} required /></label>
      <label className="text-sm md:col-span-2"><span className="mb-1 block font-medium">Address</span><Input name="address" defaultValue={c?.address} required /></label>
      <label className="text-sm"><span className="mb-1 block font-medium">City</span><Input name="city" defaultValue={c?.city} required /></label>
      <label className="text-sm"><span className="mb-1 block font-medium">State</span>
        <NativeSelect name="state" defaultValue={c?.state ?? ""} required><option value="" disabled>Select</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</NativeSelect>
      </label>
      <label className="text-sm"><span className="mb-1 block font-medium">Capacity</span><Input name="capacity" type="number" min={1} defaultValue={c?.capacity} required /></label>
      <label className="text-sm"><span className="mb-1 block font-medium">Reporting time</span><Input name="reportingTime" defaultValue={c?.reportingTime ?? ""} placeholder="Uses exam default" /></label>
      <label className="flex items-center gap-2 pt-6 text-sm font-semibold"><input type="checkbox" name="isApproved" defaultChecked={c?.isApproved} className="size-4 accent-[#174EA6]" /> Approved centre</label>
    </div>
  );
}

export default async function CentresAdmin() {
  await requireAdmin("centres:manage");
  const exam = await getCurrentExam();
  if (!exam) return null;
  const [centres, confirmed, allocated] = await Promise.all([
    db.examinationCentre.findMany({ where: { examinationId: exam.id }, include: { _count: { select: { allocations: true } } }, orderBy: { code: "asc" } }),
    db.registration.count({ where: { examinationId: exam.id, status: "CONFIRMED" } }),
    db.centreAllocation.count({ where: { registration: { examinationId: exam.id, status: "CONFIRMED" } } }),
  ]);
  const capacity = centres.filter((c) => c.isApproved).reduce((s, c) => s + c.capacity, 0);
  return (
    <>
      <AdminPageHeader
        title="Examination centres"
        description="Only approved centres can receive students or appear on admit cards."
        actions={
          <ActionForm action={autoAllocateAction}>
            <input type="hidden" name="examinationId" value={exam.id} />
            <SubmitButton size="sm">Auto-allocate unallocated students</SubmitButton>
          </ActionForm>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Approved centres" value={centres.filter((c) => c.isApproved).length} hint={`${centres.length} total`} />
        <StatCard label="Approved capacity" value={capacity.toLocaleString("en-IN")} />
        <StatCard tone="navy" label="Allocated" value={`${allocated} / ${confirmed}`} hint="Confirmed registrations" />
      </div>
      <p className="mb-4 text-sm text-muted">Auto-allocation matches each student to an approved centre in the same city, then the same state, while capacity remains. Individual allocations can be changed from a registration&apos;s page.</p>
      <div className="space-y-4">
        {centres.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">{c.code} — {c.name} <Badge tone={c.isApproved ? "success" : "warning"}>{c.isApproved ? "Approved" : "Not approved"}</Badge></CardTitle>
              <span className="text-sm text-muted">{c._count.allocations} / {c.capacity} allocated</span>
            </CardHeader>
            <CardBody>
              <ActionForm action={saveCentre} className="space-y-4">
                <input type="hidden" name="id" value={c.id} />
                <CentreFields c={c} />
                <SubmitButton size="sm">Save centre</SubmitButton>
              </ActionForm>
            </CardBody>
          </Card>
        ))}
        <Card>
          <CardHeader><CardTitle>Add a centre</CardTitle></CardHeader>
          <CardBody>
            <ActionForm action={saveCentre} resetOnSuccess className="space-y-4">
              <input type="hidden" name="examinationId" value={exam.id} />
              <CentreFields />
              <SubmitButton size="sm">Add centre</SubmitButton>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
