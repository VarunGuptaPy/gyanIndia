import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ActionForm, SubmitButton } from "@/components/admin/action-form";
import { requireAdmin } from "@/lib/session";
import { can, ROLE_LABELS, ROLES, type AppRole } from "@/lib/rbac";
import { db } from "@/lib/db";
import { getSetting, paymentsConfigured } from "@/lib/exam";
import { emailConfigured } from "@/lib/email";
import { formatDateTime } from "@/lib/format";
import { createStaffUser, setUserActive, updateAnnouncement } from "@/server/actions/admin";

export const metadata = { title: "Settings" };

export default async function SettingsAdmin() {
  const user = await requireAdmin("settings:manage");
  const announcement = await getSetting("announcement", { text: "", enabled: true });
  const staff = can(user.role, "users:manage")
    ? await db.user.findMany({ where: { role: { not: "GUARDIAN" } }, orderBy: { createdAt: "asc" } })
    : [];
  return (
    <>
      <AdminPageHeader title="Settings" description="Website content, integrations and staff access. Examination policies are managed under Examination." />
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Announcement bar</CardTitle></CardHeader>
          <CardBody>
            <ActionForm action={updateAnnouncement} className="flex flex-wrap items-end gap-3">
              <label className="min-w-72 flex-1 text-sm"><span className="mb-1 block font-medium">Text</span><Input name="text" defaultValue={announcement.text} maxLength={160} /></label>
              <label className="flex h-11 items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={announcement.enabled} className="size-4 accent-[#174EA6]" /> Show</label>
              <SubmitButton size="sm" className="h-11">Save</SubmitButton>
            </ActionForm>
            <p className="mt-2 text-xs text-muted">The registration link next to the announcement appears only while registration is open.</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p className="flex items-center justify-between">Razorpay payments <Badge tone={paymentsConfigured() ? "success" : "warning"}>{paymentsConfigured() ? "Configured" : "Not configured"}</Badge></p>
            <p className="flex items-center justify-between">Razorpay webhook secret <Badge tone={process.env.RAZORPAY_WEBHOOK_SECRET ? "success" : "warning"}>{process.env.RAZORPAY_WEBHOOK_SECRET ? "Configured" : "Not configured"}</Badge></p>
            <p className="flex items-center justify-between">Live payments approval flag <Badge tone={process.env.PAYMENTS_LIVE_APPROVED === "true" ? "success" : "neutral"}>{process.env.PAYMENTS_LIVE_APPROVED === "true" ? "Approved" : "Not approved"}</Badge></p>
            <p className="flex items-center justify-between">Email (Resend) <Badge tone={emailConfigured() ? "success" : "warning"}>{emailConfigured() ? "Configured" : "Not configured"}</Badge></p>
            <p className="pt-2 text-xs text-muted">Credentials are set as environment variables and are never shown here.</p>
          </CardBody>
        </Card>
        {can(user.role, "users:manage") && (
          <Card>
            <CardHeader><CardTitle>Staff accounts</CardTitle></CardHeader>
            <Table>
              <THead><tr><TH>Name</TH><TH>Email</TH><TH>Role</TH><TH>Last login</TH><TH>Status</TH></tr></THead>
              <tbody>
                {staff.map((s) => (
                  <TR key={s.id}>
                    <TD className="font-medium">{s.name}</TD>
                    <TD>{s.email}</TD>
                    <TD>{ROLE_LABELS[s.role as AppRole]}</TD>
                    <TD className="text-xs text-muted">{formatDateTime(s.lastLoginAt)}</TD>
                    <TD>
                      {s.id === user.id ? <Badge tone="royal">You</Badge> : (
                        <ActionForm action={setUserActive}>
                          <input type="hidden" name="id" value={s.id} />
                          <input type="hidden" name="active" value={s.isActive ? "false" : "true"} />
                          <SubmitButton size="sm" variant={s.isActive ? "ghost" : "outline"}>{s.isActive ? "Deactivate" : "Activate"}</SubmitButton>
                        </ActionForm>
                      )}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
            <CardBody className="border-t border-line">
              <p className="mb-3 text-sm font-semibold text-navy">Add staff member</p>
              <ActionForm action={createStaffUser} resetOnSuccess className="grid gap-3 md:grid-cols-5">
                <Input name="name" placeholder="Full name" required aria-label="Full name" />
                <Input name="email" type="email" placeholder="Email" required aria-label="Email" />
                <NativeSelect name="role" defaultValue="EXAM_ADMIN" aria-label="Role">{ROLES.filter((r) => r !== "GUARDIAN").map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</NativeSelect>
                <Input name="password" type="password" placeholder="Temporary password (12+)" required minLength={12} aria-label="Temporary password" autoComplete="new-password" />
                <SubmitButton size="sm" className="h-11">Create</SubmitButton>
              </ActionForm>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
