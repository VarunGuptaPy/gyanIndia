import type { Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TR, TD, EmptyRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar, Pagination } from "@/components/admin/page-header";
import { requireAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Audit Logs" };
const PAGE = 50;

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<{ action?: string; page?: string }> }) {
  await requireAdmin("audit:view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where: Prisma.AuditLogWhereInput = sp.action ? { action: { contains: sp.action } } : {};
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({ where, include: { actor: { select: { name: true, email: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.auditLog.count({ where }),
  ]);
  return (
    <>
      <AdminPageHeader title="Audit logs" description="A tamper-evident trail of sensitive actions. Logs contain identifiers only — never children's personal data or payment credentials." />
      <FilterBar>
        <label className="min-w-56 flex-1 text-sm"><span className="mb-1 block font-medium">Action contains</span><Input name="action" defaultValue={sp.action} placeholder="e.g. payment, results, auth" /></label>
        <Button type="submit" size="sm" className="h-11">Filter</Button>
      </FilterBar>
      <Card>
        <Table>
          <THead><tr><TH>When</TH><TH>Action</TH><TH>Actor</TH><TH>Entity</TH><TH>Details</TH></tr></THead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={5}>No log entries.</EmptyRow>}
            {rows.map((l) => (
              <TR key={l.id}>
                <TD className="text-xs whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</TD>
                <TD><code className="rounded bg-paper px-1.5 py-0.5 text-xs">{l.action}</code></TD>
                <TD className="text-xs">{l.actor ? `${l.actor.name} (${l.actor.email})` : "System / public"}</TD>
                <TD className="text-xs">{l.entityType}{l.entityId ? ` · ${l.entityId.slice(-10)}` : ""}</TD>
                <TD className="max-w-72 font-mono text-[0.7rem] break-all text-muted">{l.metadata ? JSON.stringify(l.metadata) : ""}</TD>
              </TR>
            ))}
          </tbody>
        </Table>
        <Pagination page={page} pageSize={PAGE} total={total} params={{ action: sp.action }} />
      </Card>
    </>
  );
}
