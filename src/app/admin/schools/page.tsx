import { Card } from "@/components/ui/card";
import { NativeSelect, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, FilterBar } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { formatDateTime, humanize } from "@/lib/format";
import { updatePartnership } from "@/server/actions/admin";

export const metadata = { title: "Schools" };
const STATUSES = ["NEW", "CONTACTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] as const;
const tone = (s: string) => (s === "APPROVED" ? "success" : s === "REJECTED" ? "danger" : s === "NEW" ? "gold" : "royal") as "success";

export default async function SchoolsAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireAdmin("schools:view");
  const { status } = await searchParams;
  const rows = await db.schoolPartnership.findMany({
    where: status ? { status: status as "NEW" } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const manage = can(user.role, "schools:manage");
  return (
    <>
      <AdminPageHeader title="School partnerships" description="Only schools marked Approved are recorded as official partners and may be described as such." />
      <FilterBar>
        <label className="w-56 text-sm"><span className="mb-1 block font-medium">Status</span>
          <NativeSelect name="status" defaultValue={status ?? ""}><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</NativeSelect>
        </label>
        <Button type="submit" size="sm" className="h-11">Apply</Button>
      </FilterBar>
      <div className="space-y-4">
        {rows.length === 0 && <Card className="p-10 text-center text-muted">No partnership enquiries yet.</Card>}
        {rows.map((p) => (
          <Card key={p.id} className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              <div className="space-y-1 text-sm">
                <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{p.schoolName}</h2><Badge tone={tone(p.status)}>{humanize(p.status)}</Badge>{p.requestVisit && <Badge tone="royal">Visit requested</Badge>}</div>
                <p className="text-muted">{p.board} · {p.address}, {p.city}, {p.state}</p>
                <p><strong>{p.contactName}</strong>{p.contactRole ? `, ${p.contactRole}` : ""} · <a className="text-royal" href={`mailto:${p.officialEmail}`}>{p.officialEmail}</a> · {p.contactNumber}</p>
                <p className="text-muted">Classes {p.classesOffered} · ~{p.estimatedStudents} interested students · received {formatDateTime(p.createdAt)}</p>
                {p.message && <p className="mt-2 max-w-2xl rounded-lg bg-paper p-3 text-ink/80">{p.message}</p>}
              </div>
              {manage && (
                <ActionForm action={updatePartnership} className="w-full space-y-2 lg:w-72">
                  <input type="hidden" name="id" value={p.id} />
                  <NativeSelect name="status" defaultValue={p.status} aria-label="Status">{STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}</NativeSelect>
                  <Input name="internalNotes" defaultValue={p.internalNotes ?? ""} placeholder="Internal notes" aria-label="Internal notes" />
                  <SubmitButton size="sm" className="w-full">Update</SubmitButton>
                </ActionForm>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
