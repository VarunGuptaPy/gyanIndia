import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, FilterBar } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { formatDateTime, humanize } from "@/lib/format";
import { updateEnquiryStatus } from "@/server/actions/admin";

export const metadata = { title: "Enquiries" };
const STATUSES = ["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"] as const;

export default async function EnquiriesAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin("enquiries:manage");
  const { status } = await searchParams;
  const rows = await db.enquiry.findMany({ where: status ? { status: status as "NEW" } : {}, orderBy: { createdAt: "desc" }, take: 200 });
  return (
    <>
      <AdminPageHeader title="Enquiries" description="Messages submitted through the contact form." />
      <FilterBar>
        <label className="w-56 text-sm"><span className="mb-1 block font-medium">Status</span>
          <NativeSelect name="status" defaultValue={status ?? ""}><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</NativeSelect>
        </label>
        <Button type="submit" size="sm" className="h-11">Apply</Button>
      </FilterBar>
      <div className="space-y-4">
        {rows.length === 0 && <Card className="p-10 text-center text-muted">No enquiries.</Card>}
        {rows.map((e) => (
          <Card key={e.id} className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              <div className="min-w-0 space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{e.name}</h2><Badge tone="royal">{e.category}</Badge><Badge tone={e.status === "NEW" ? "gold" : e.status === "RESOLVED" ? "success" : "neutral"}>{humanize(e.status)}</Badge></div>
                <p className="text-muted"><a className="text-royal" href={`mailto:${e.email}`}>{e.email}</a>{e.phone ? ` · ${e.phone}` : ""} · {formatDateTime(e.createdAt)}</p>
                <p className="mt-2 max-w-3xl whitespace-pre-line text-ink/85">{e.message}</p>
              </div>
              <ActionForm action={updateEnquiryStatus} className="flex shrink-0 gap-2 lg:w-60">
                <input type="hidden" name="id" value={e.id} />
                <NativeSelect name="status" defaultValue={e.status} aria-label="Status">{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</NativeSelect>
                <SubmitButton size="sm" className="h-11">Save</SubmitButton>
              </ActionForm>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
