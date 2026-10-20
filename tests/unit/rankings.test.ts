import { describe, expect, it } from "vitest";
import { computeRankings, marksToHundredths, rankGroup, type RankCandidate } from "@/lib/rankings";

const c = (reg: string, marks: string, cls = 6): RankCandidate => ({
  registrationSubjectId: `rs-${reg}`,
  registrationNumber: reg,
  classGrade: cls,
  marks,
});

describe("ranking calculations", () => {
  it("parses marks exactly", () => {
    expect(marksToHundredths("87.5")).toBe(8750);
    expect(marksToHundredths("87.05")).toBe(8705);
    expect(marksToHundredths("100")).toBe(10000);
    expect(() => marksToHundredths("1e3")).toThrow();
  });

  it("orders by marks descending", () => {
    const r = rankGroup([c("A", "50"), c("B", "90"), c("C", "70")], "SHARED_COMPETITION");
    expect(r.map((x) => [x.registrationNumber, x.rank])).toEqual([["B", 1], ["C", 2], ["A", 3]]);
  });

  it("shares ranks on ties with competition ranking (1,2,2,4)", () => {
    const r = rankGroup([c("A", "90"), c("B", "80"), c("C", "80"), c("D", "70")], "SHARED_COMPETITION");
    expect(r.map((x) => x.rank)).toEqual([1, 2, 2, 4]);
  });

  it("shares ranks on ties with dense ranking (1,2,2,3)", () => {
    const r = rankGroup([c("A", "90"), c("B", "80"), c("C", "80"), c("D", "70")], "SHARED_DENSE");
    expect(r.map((x) => x.rank)).toEqual([1, 2, 2, 3]);
  });

  it("does not invent a tie-break: equal marks always get equal ranks", () => {
    const r = rankGroup([c("Z", "88.50"), c("A", "88.5")], "SHARED_COMPETITION");
    expect(r[0].rank).toBe(r[1].rank);
  });

  it("is deterministic regardless of input order", () => {
    const input = [c("C", "70"), c("A", "80"), c("B", "80"), c("D", "60")];
    const a = rankGroup(input, "SHARED_COMPETITION");
    const b = rankGroup([...input].reverse(), "SHARED_COMPETITION");
    expect(a).toEqual(b);
  });

  it("ranks within each class when scope is SUBJECT_AND_CLASS", () => {
    const r = computeRankings([c("A", "90", 5), c("B", "60", 6), c("C", "95", 5), c("D", "70", 6)], "SUBJECT_AND_CLASS", "SHARED_COMPETITION");
    const byReg = Object.fromEntries(r.map((x) => [x.registrationNumber, [x.group, x.rank]]));
    expect(byReg).toEqual({ C: [5, 1], A: [5, 2], D: [6, 1], B: [6, 2] });
  });

  it("ranks across classes when scope is SUBJECT_ONLY", () => {
    const r = computeRankings([c("A", "90", 5), c("B", "60", 6), c("C", "95", 5)], "SUBJECT_ONLY", "SHARED_COMPETITION");
    expect(r.map((x) => [x.registrationNumber, x.rank, x.group])).toEqual([["C", 1, null], ["A", 2, null], ["B", 3, null]]);
  });

  it("handles empty input", () => {
    expect(computeRankings([], "SUBJECT_ONLY", "SHARED_DENSE")).toEqual([]);
  });
});
