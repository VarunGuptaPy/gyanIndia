import type { Permission } from "@/lib/rbac";

export type AdminNavItem = { href: string; label: string; icon: string; permission: Permission; group: string };

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard", permission: "dashboard:view", group: "General" },
  { href: "/admin/students", label: "Students", icon: "students", permission: "students:view", group: "Participants" },
  { href: "/admin/registrations", label: "Registrations", icon: "registrations", permission: "registrations:view", group: "Participants" },
  { href: "/admin/payments", label: "Payments", icon: "payments", permission: "payments:view", group: "Participants" },
  { href: "/admin/schools", label: "Schools", icon: "schools", permission: "schools:view", group: "Participants" },
  { href: "/admin/examinations", label: "Examination", icon: "exam", permission: "exams:manage", group: "Examination" },
  { href: "/admin/subjects", label: "Subjects", icon: "subjects", permission: "subjects:manage", group: "Examination" },
  { href: "/admin/centres", label: "Centres", icon: "centres", permission: "centres:manage", group: "Examination" },
  { href: "/admin/admit-cards", label: "Admit Cards", icon: "admit", permission: "admitcards:manage", group: "Examination" },
  { href: "/admin/results", label: "Results", icon: "results", permission: "results:manage", group: "Outcomes" },
  { href: "/admin/rankings", label: "Rankings", icon: "rankings", permission: "rankings:manage", group: "Outcomes" },
  { href: "/admin/awards", label: "Awards", icon: "awards", permission: "awards:manage", group: "Outcomes" },
  { href: "/admin/certificates", label: "Certificates", icon: "certificates", permission: "certificates:manage", group: "Outcomes" },
  { href: "/admin/enquiries", label: "Enquiries", icon: "enquiries", permission: "enquiries:manage", group: "Operations" },
  { href: "/admin/settings", label: "Settings", icon: "settings", permission: "settings:manage", group: "Operations" },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "audit", permission: "audit:view", group: "Operations" },
];
