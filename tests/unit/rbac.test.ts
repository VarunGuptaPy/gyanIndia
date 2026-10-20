import { describe, expect, it } from "vitest";
import { can, isAdminRole, ROLES } from "@/lib/rbac";

describe("role-based access", () => {
  it("gives super admins every permission", () => {
    for (const p of ["users:manage", "payments:refund", "results:publish", "audit:view"] as const) {
      expect(can("SUPER_ADMIN", p)).toBe(true);
    }
  });
  it("gives guardians no admin permissions", () => {
    expect(can("GUARDIAN", "dashboard:view")).toBe(false);
    expect(isAdminRole("GUARDIAN")).toBe(false);
  });
  it("keeps finance separate from examination operations", () => {
    expect(can("FINANCE_ADMIN", "payments:refund")).toBe(true);
    expect(can("FINANCE_ADMIN", "results:manage")).toBe(false);
    expect(can("EXAM_ADMIN", "payments:refund")).toBe(false);
    expect(can("EXAM_ADMIN", "payments:view")).toBe(false);
  });
  it("limits school coordinators to schools and enquiries", () => {
    expect(can("SCHOOL_COORDINATOR", "schools:manage")).toBe(true);
    expect(can("SCHOOL_COORDINATOR", "students:view")).toBe(false);
    expect(can("SCHOOL_COORDINATOR", "certificates:manage")).toBe(false);
  });
  it("only super admins manage staff and view audit logs", () => {
    for (const r of ROLES) {
      expect(can(r, "users:manage")).toBe(r === "SUPER_ADMIN");
      expect(can(r, "audit:view")).toBe(r === "SUPER_ADMIN");
    }
  });
  it("denies unknown or missing roles", () => {
    expect(can(undefined, "dashboard:view")).toBe(false);
    expect(can("ROOT", "dashboard:view")).toBe(false);
    expect(isAdminRole("ROOT")).toBe(false);
  });
});
