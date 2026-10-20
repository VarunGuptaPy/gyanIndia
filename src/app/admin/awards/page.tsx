import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { getCurrentExam } from "@/lib/exam";
import { deleteAwardCategory, saveAwardCategory } from "@/server/actions/admin";
import type { AwardCategory } from "@prisma/client";

export const metadata = { title: "Awards" };

function AwardForm({ a, examinationId }: { a?: AwardCategory; examinationId: string }) {
  return (
    <ActionForm action={saveAwardCategory} resetOnSuccess={!a} className="grid gap-4 md:grid-cols-6">
      {a && <input type="hidden" name="id" value={a.id} />}
      <input type="hidden" name="examinationId" value={examinationId} />
      <label className="text-sm md:col-span-2"><span className="mb-1 block font-medium">Title</span><Input name="title" defaultValue={a?.title} required /></label>
      <label className="text-sm"><span className="mb-1 block font-medium">From rank</span><Input name="rankFrom" type="number" min={1} defaultValue={a?.rankFrom} required /></label>
      <label className="text-sm"><span className="mb-1 block font-medium">To rank</span><Input name="rankTo" type="number" min={1} defaultValue={a?.rankTo} required /></label>
      <label className="text-sm"><span className="mb-1 block font-medium">Cash prize (₹)</span><Input name="cashPrize" inputMode="decimal" defaultValue={a?.cashPrizePaise ? a.cashPrizePaise / 100 : ""} placeholder="None" /></label>
      <label className="text-sm"><span className="mb-1 block font-medium">Order</span><Input name="sortOrder" type="number" defaultValue={a?.sortOrder ?? 0} /></label>
      <label className="text-sm md:col-span-3"><span className="mb-1 block font-medium">Description / eligibility</span><Input name="description" defaultValue={a?.description ?? ""} /></label>
      <div className="flex flex-wrap items-center gap-4 text-sm md:col-span-3">
        {(["includesTrophy", "includesMedal", "includesCertificate"] as const).map((k) => (
          <label key={k} className="flex items-center gap-2"><input type="checkbox" name={k} defaultChecked={a ? a[k] : k === "includesCertificate"} className="size-4 accent-[#174EA6]" /> {k.replace("includes", "")}</label>
        ))}
        <label className="flex items-center gap-2 font-semibold text-gold-700"><input type="checkbox" name="isConfirmed" defaultChecked={a?.isConfirmed} className="size-4 accent-[#D4A83F]" /> Officially confirmed</label>
      </div>
      <div className="md:col-span-6"><SubmitButton size="sm">{a ? "Save" : "Add category"}</SubmitButton></div>
    </ActionForm>
  );
}

export default async function AwardsAdmin() {
  await requireAdmin("awards:manage");
  const exam = await getCurrentExam();
  if (!exam) return null;
  return (
    <>
      <AdminPageHeader title="Award categories" description="Configure award categories and prizes. Prize details appear publicly only when a category is marked Officially confirmed." />
      <Alert tone="info" className="mb-6">Unconfirmed categories show “Prize details to be announced”. Do not confirm a prize until it has been formally approved.</Alert>
      <div className="space-y-4">
        {exam.awardCategories.map((a) => (
          <Card key={a.id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">{a.title} <Badge tone={a.isConfirmed ? "success" : "warning"}>{a.isConfirmed ? "Confirmed" : "Unconfirmed"}</Badge></CardTitle>
              <ActionForm action={deleteAwardCategory} confirm="Delete this award category?"><input type="hidden" name="id" value={a.id} /><SubmitButton size="sm" variant="ghost">Delete</SubmitButton></ActionForm>
            </CardHeader>
            <CardBody><AwardForm a={a} examinationId={exam.id} /></CardBody>
          </Card>
        ))}
        <Card>
          <CardHeader><CardTitle>New category</CardTitle></CardHeader>
          <CardBody><AwardForm examinationId={exam.id} /></CardBody>
        </Card>
      </div>
    </>
  );
}
