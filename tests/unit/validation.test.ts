import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { certificateNumberSchema, enquirySchema, registrationSchema } from "@/lib/validation";

const base = () => ({
  student: { fullName: "Aarav Sharma", classGrade: "6", board: "CBSE", schoolName: "Test School", city: "Lucknow", state: "Uttar Pradesh", examLanguage: "ENGLISH" },
  guardian: { fullName: "Priya Sharma", mobile: "98765 43210", email: "Priya@Example.com" },
  password: "Password12345",
  subjectIds: ["a", "b"],
  consent: { isGuardian: true, dataProcessing: true, terms: true },
  idempotencyKey: randomUUID(),
});

describe("student registration validation", () => {
  it("accepts valid input and normalises values", () => {
    const r = registrationSchema.parse(base());
    expect(r.student.classGrade).toBe(6);
    expect(r.guardian.mobile).toBe("+919876543210");
    expect(r.guardian.email).toBe("priya@example.com");
  });

  it("strips unknown fields such as a client-supplied amount", () => {
    const r = registrationSchema.parse({ ...base(), totalPaise: 1 }) as Record<string, unknown>;
    expect(r.totalPaise).toBeUndefined();
  });

  it.each(["12345", "5876543210", "+1 9876543210", "98765432101"])("rejects invalid mobile %s", (mobile) => {
    const input = base();
    input.guardian.mobile = mobile;
    expect(registrationSchema.safeParse(input).success).toBe(false);
  });

  it("requires the student name in English letters", () => {
    const input = base();
    input.student.fullName = "आरव शर्मा";
    expect(registrationSchema.safeParse(input).success).toBe(false);
    input.student.fullName = "<script>";
    expect(registrationSchema.safeParse(input).success).toBe(false);
  });

  it("rejects an empty subject list and duplicate subjects", () => {
    const a = base();
    a.subjectIds = [];
    expect(registrationSchema.safeParse(a).success).toBe(false);
    const b = base();
    b.subjectIds = ["a", "a"];
    expect(registrationSchema.safeParse(b).success).toBe(false);
  });

  it("rejects an invalid class", () => {
    const input = base();
    input.student.classGrade = "0";
    expect(registrationSchema.safeParse(input).success).toBe(false);
  });
});

describe("guardian consent requirements", () => {
  it.each(["isGuardian", "dataProcessing", "terms"] as const)("requires %s to be explicitly true", (key) => {
    const input = base();
    (input.consent as Record<string, unknown>)[key] = false;
    const r = registrationSchema.safeParse(input);
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path.join(".") === `consent.${key}`)).toBe(true);
  });

  it("rejects missing consent entirely", () => {
    const input = base() as Record<string, unknown>;
    delete input.consent;
    expect(registrationSchema.safeParse(input).success).toBe(false);
  });
});

describe("other forms", () => {
  it("requires consent on the contact form", () => {
    const r = enquirySchema.safeParse({ name: "Ravi Kumar", email: "r@example.com", category: "General enquiry", message: "Hello there, a question.", consent: false });
    expect(r.success).toBe(false);
  });
  it("validates certificate numbers", () => {
    expect(certificateNumberSchema.parse(" gyan-c26-abcd2345 ")).toBe("GYAN-C26-ABCD2345");
    expect(certificateNumberSchema.safeParse("12345").success).toBe(false);
  });
});
