import { describe, expect, it } from "vitest";
import { validateResultCsv } from "@/lib/result-import";

const enrolled = new Map([
  ["NTHE26-000001", "rs1"],
  ["NTHE26-000002", "rs2"],
  ["NTHE26-000003", "rs3"],
]);

describe("result CSV import validation", () => {
  it("accepts a valid file", () => {
    const v = validateResultCsv("registration_number,marks,status\nNTHE26-000001,88.5,\nNTHE26-000002,,ABSENT\n", 100, enrolled);
    expect(v.errors).toEqual([]);
    expect(v.valid).toEqual([
      { line: 2, registrationNumber: "NTHE26-000001", registrationSubjectId: "rs1", marks: "88.5", status: "PRESENT" },
      { line: 3, registrationNumber: "NTHE26-000002", registrationSubjectId: "rs2", marks: null, status: "ABSENT" },
    ]);
  });

  it("normalises header names and registration number case", () => {
    const v = validateResultCsv("Registration Number,Marks\nnthe26-000001,50", 100, enrolled);
    expect(v.valid[0].registrationNumber).toBe("NTHE26-000001");
  });

  it("rejects files without required columns", () => {
    const v = validateResultCsv("reg,score\nA,1", 100, enrolled);
    expect(v.valid).toHaveLength(0);
    expect(v.errors[0].error).toMatch(/Missing column/);
  });

  it("detects duplicate rows", () => {
    const v = validateResultCsv("registration_number,marks\nNTHE26-000001,50\nNTHE26-000001,60", 100, enrolled);
    expect(v.valid).toHaveLength(1);
    expect(v.errors[0]).toMatchObject({ line: 3, error: "Duplicate of line 2." });
  });

  it.each([
    ["-5", /non-negative/],
    ["abc", /non-negative/],
    ["50.555", /2 decimal/],
    ["101", /exceed/],
    ["", /non-negative/],
  ])("rejects invalid score %s", (marks, msg) => {
    const v = validateResultCsv(`registration_number,marks\nNTHE26-000001,${marks}`, 100, enrolled);
    expect(v.valid).toHaveLength(0);
    expect(v.errors[0].error).toMatch(msg);
  });

  it("rejects unknown or unconfirmed registrations", () => {
    const v = validateResultCsv("registration_number,marks\nNTHE26-999999,50", 100, enrolled);
    expect(v.errors[0].error).toMatch(/No confirmed registration/);
  });

  it("rejects marks given for an absent candidate and invalid statuses", () => {
    const v = validateResultCsv("registration_number,marks,status\nNTHE26-000001,50,ABSENT\nNTHE26-000002,40,LATE", 100, enrolled);
    expect(v.errors.map((e) => e.error)).toEqual(["Marks must be empty when status is ABSENT.", "Status must be PRESENT, ABSENT or WITHHELD."]);
  });

  it("accepts full and zero marks", () => {
    const v = validateResultCsv("registration_number,marks\nNTHE26-000001,100\nNTHE26-000002,0", 100, enrolled);
    expect(v.errors).toEqual([]);
  });
});
