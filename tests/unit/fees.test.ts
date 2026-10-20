import { describe, expect, it } from "vitest";
import { calculateFees, FeeError, formatPaise, totalForSubjectCount } from "@/lib/fees";

const SUBJECTS = Array.from({ length: 7 }, (_, i) => ({ id: `s${i + 1}`, feePaise: 25000 }));

describe("registration fee calculation", () => {
  it.each([
    [1, 30000],
    [2, 55000],
    [3, 80000],
    [4, 105000],
    [5, 130000],
    [6, 155000],
    [7, 180000],
  ])("%i subject(s) costs %i paise", (n, expected) => {
    expect(totalForSubjectCount(n)).toBe(expected);
    const ids = SUBJECTS.slice(0, n).map((s) => s.id);
    const fees = calculateFees(ids, SUBJECTS, 5000);
    expect(fees.totalPaise).toBe(expected);
    expect(fees.registrationFeePaise).toBe(5000);
    expect(fees.subjectsFeePaise).toBe(25000 * n);
    expect(Number.isInteger(fees.totalPaise)).toBe(true);
  });

  it("formats rupees in Indian format", () => {
    expect(formatPaise(180000)).toBe("₹1,800");
    expect(formatPaise(105000)).toBe("₹1,050");
  });

  it("rejects zero subjects", () => {
    expect(() => calculateFees([], SUBJECTS, 5000)).toThrow(FeeError);
    expect(totalForSubjectCount(0)).toBe(0);
  });

  it("rejects duplicate subject selections", () => {
    expect(() => calculateFees(["s1", "s1"], SUBJECTS, 5000)).toThrow(/more than once/);
  });

  it("rejects unknown or unavailable subjects", () => {
    expect(() => calculateFees(["s1", "nope"], SUBJECTS, 5000)).toThrow(/not available/);
  });

  it("uses each subject's configured fee, not a client value", () => {
    const mixed = [{ id: "a", feePaise: 25000 }, { id: "b", feePaise: 30000 }];
    expect(calculateFees(["a", "b"], mixed, 5000).totalPaise).toBe(60000);
  });

  it("rejects invalid fee configuration", () => {
    expect(() => calculateFees(["a"], [{ id: "a", feePaise: 25.5 }], 5000)).toThrow(FeeError);
    expect(() => calculateFees(["a"], [{ id: "a", feePaise: 100 }], -1)).toThrow(FeeError);
  });
});
