import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { can, ROLE_LABELS, type AppRole } from "@/lib/rbac";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ADMIN_NAV } from "@/components/admin/nav-items";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin | GYAN" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const items = ADMIN_NAV.filter((i) => can(user.role, i.permission));
  return (
    <div className="min-h-screen bg-paper">
      <AdminSidebar items={items} user={{ name: user.name, roleLabel: ROLE_LABELS[user.role as AppRole] }} />
      <main id="main" className="lg:pl-64">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
