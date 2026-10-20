import { describe, expect, it } from "vitest";
import { formatDate, maskName, orTBA, TBA } from "@/lib/format";
import { admitCardNumberFor, registrationNumberFor } from "@/lib/counters";

describe("formatting helpers", () => {
  it("masks names to initials for public verification", () => {
    expect(maskName("Aarav Kumar Sharma")).toBe("A. K. S.");
  });
  it("shows To Be Announced for missing values", () => {
    expect(orTBA(null)).toBe(TBA);
    expect(orTBA(90, (m) => `${m} min`)).toBe("90 min");
    expect(formatDate(null)).toBe(TBA);
  });
  it("formats the exam date in IST", () => {
    expect(formatDate(new Date("2026-12-12T00:00:00+05:30"))).toBe("12 December 2026");
  });
  it("builds registration and admit card numbers", () => {
    expect(registrationNumberFor(2026, 42)).toBe("NTHE26-000042");
    expect(admitCardNumberFor(2026, 7)).toBe("NTHE26-AC-000007");
  });
});
