import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Table, THead, TH, TR, TD, EmptyRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar, Pagination } from "@/components/admin/page-header";
import { RegistrationStatusBadge } from "@/components/student/status";
import { requireAdmin } from "@/lib/session";
import { can } from "@/lib/rbac";
import { db } from "@/lib/db";
import { INDIAN_STATES } from "@/lib/site";
import { studentWhere } from "@/server/admin-queries";

export const metadata = { title: "Students" };
const PAGE = 25;

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; cls?: string; state?: string; page?: string }> }) {
  const user = await requireAdmin("students:view");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = studentWhere(sp);
  const [rows, total] = await Promise.all([
    db.student.findMany({
      where,
      include: { registrations: { orderBy: { createdAt: "desc" }, take: 1 }, guardian: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
    }),
    db.student.count({ where }),
  ]);
  const exportHref = `/api/admin/export/students?${new URLSearchParams(Object.entries({ q: sp.q, cls: sp.cls, state: sp.state }).filter(([, v]) => v) as [string, string][])}`;

  return (
    <>
      <AdminPageHeader
        title="Students"
        description="Student records are confidential. Access and exports are logged."
        actions={can(user.role, "students:export") && <Button asChild variant="outline" size="sm"><a href={exportHref}><Download aria-hidden /> Export CSV</a></Button>}
      />
      <FilterBar>
        <label className="min-w-56 flex-1 text-sm"><span className="mb-1 block font-medium">Search</span><Input name="q" defaultValue={sp.q} placeholder="Name, school or registration no." /></label>
        <label className="w-36 text-sm"><span className="mb-1 block font-medium">Class</span>
          <NativeSelect name="cls" defaultValue={sp.cls ?? ""}><option value="">All</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>Class {i + 1}</option>)}</NativeSelect>
        </label>
        <label className="w-56 text-sm"><span className="mb-1 block font-medium">State</span>
          <NativeSelect name="state" defaultValue={sp.state ?? ""}><option value="">All</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</NativeSelect>
        </label>
        <Button type="submit" size="sm" className="h-11">Apply</Button>
      </FilterBar>
      <Card>
        <Table>
          <THead><tr><TH>Student</TH><TH>Class</TH><TH>School</TH><TH>City / State</TH><TH>Guardian</TH><TH>Registration</TH></tr></THead>
          <tbody>
            {rows.length === 0 && <EmptyRow colSpan={6}>No students match these filters.</EmptyRow>}
            {rows.map((s) => {
              const reg = s.registrations[0];
              return (
                <TR key={s.id}>
                  <TD className="font-semibold text-navy">{s.fullName}</TD>
                  <TD>{s.classGrade}</TD>
                  <TD className="max-w-56 truncate">{s.schoolName}<span className="block text-xs text-muted">{s.board}</span></TD>
                  <TD>{s.city}<span className="block text-xs text-muted">{s.state}</span></TD>
                  <TD>{s.guardian.fullName}</TD>
                  <TD>{reg ? <Link href={`/admin/registrations/${reg.id}`} className="space-y-1"><span className="block font-mono text-xs text-royal">{reg.registrationNumber ?? "—"}</span><RegistrationStatusBadge status={reg.status} /></Link> : "—"}</TD>
                </TR>
              );
            })}
          </tbody>
        </Table>
        <Pagination page={page} pageSize={PAGE} total={total} params={{ q: sp.q, cls: sp.cls, state: sp.state }} />
      </Card>
    </>
  );
}
