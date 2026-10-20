// Role-based access control. Permissions are enforced on the server for every
// admin page, server action and API route — the UI only hides what a role can't use.

export const ROLES = [
  "SUPER_ADMIN",
  "EXAM_ADMIN",
  "FINANCE_ADMIN",
  "SCHOOL_COORDINATOR",
  "GUARDIAN",
] as const;
export type AppRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  EXAM_ADMIN: "Examination Administrator",
  FINANCE_ADMIN: "Finance Administrator",
  SCHOOL_COORDINATOR: "School Coordinator",
  GUARDIAN: "Student / Guardian",
};

export type Permission =
  | "dashboard:view"
  | "students:view"
  | "students:export"
  | "registrations:view"
  | "payments:view"
  | "payments:refund"
  | "schools:view"
  | "schools:manage"
  | "subjects:manage"
  | "exams:manage"
  | "centres:manage"
  | "admitcards:manage"
  | "results:manage"
  | "results:publish"
  | "rankings:manage"
  | "certificates:manage"
  | "enquiries:manage"
  | "awards:manage"
  | "settings:manage"
  | "audit:view"
  | "users:manage";

const ALL: Permission[] = [
  "dashboard:view", "students:view", "students:export", "registrations:view", "payments:view",
  "payments:refund", "schools:view", "schools:manage", "subjects:manage", "exams:manage",
  "centres:manage", "admitcards:manage", "results:manage", "results:publish", "rankings:manage",
  "certificates:manage", "enquiries:manage", "awards:manage", "settings:manage", "audit:view",
  "users:manage",
];

const MATRIX: Record<AppRole, readonly Permission[]> = {
  SUPER_ADMIN: ALL,
  EXAM_ADMIN: [
    "dashboard:view", "students:view", "registrations:view", "subjects:manage", "exams:manage",
    "centres:manage", "admitcards:manage", "results:manage", "results:publish", "rankings:manage",
    "certificates:manage", "awards:manage", "enquiries:manage",
  ],
  FINANCE_ADMIN: ["dashboard:view", "registrations:view", "payments:view", "payments:refund"],
  SCHOOL_COORDINATOR: ["dashboard:view", "schools:view", "schools:manage", "enquiries:manage"],
  GUARDIAN: [],
};

export function can(role: string | undefined | null, permission: Permission): boolean {
  if (!role || !(role in MATRIX)) return false;
  return MATRIX[role as AppRole].includes(permission);
}

export function isAdminRole(role: string | undefined | null): boolean {
  return !!role && role !== "GUARDIAN" && role in MATRIX;
}

export function permissionsFor(role: AppRole): readonly Permission[] {
  return MATRIX[role];
}
