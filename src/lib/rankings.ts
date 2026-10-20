// Pure ranking computation. Deterministic: candidates with equal marks always share
// a rank — there is no criteria-based tie-break because none has been approved.
// Display order within a tie is by registration number purely for stable output.

export type TiePolicy = "SHARED_COMPETITION" | "SHARED_DENSE";
export type RankingScope = "SUBJECT_AND_CLASS" | "SUBJECT_ONLY";

export type RankCandidate = {
  registrationSubjectId: string;
  registrationNumber: string;
  classGrade: number;
  /** Marks as a decimal string with up to 2 places (avoids float drift). */
  marks: string;
};

export type RankedEntry = RankCandidate & { rank: number; group: number | null };

/** Converts "87.5" → 8750 (hundredths) for exact comparison. */
export function marksToHundredths(marks: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(marks)) throw new Error(`Invalid marks value: ${marks}`);
  const [whole, frac = ""] = marks.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

export function rankGroup(
  candidates: readonly RankCandidate[],
  tiePolicy: TiePolicy,
): Omit<RankedEntry, "group">[] {
  const sorted = [...candidates].sort((a, b) => {
    const diff = marksToHundredths(b.marks) - marksToHundredths(a.marks);
    if (diff !== 0) return diff;
    return a.registrationNumber.localeCompare(b.registrationNumber);
  });

  const out: Omit<RankedEntry, "group">[] = [];
  let prevMarks: number | null = null;
  let currentRank = 0;
  let denseRank = 0;

  sorted.forEach((c, index) => {
    const m = marksToHundredths(c.marks);
    if (m !== prevMarks) {
      currentRank = index + 1;
      denseRank += 1;
      prevMarks = m;
    }
    out.push({ ...c, rank: tiePolicy === "SHARED_DENSE" ? denseRank : currentRank });
  });
  return out;
}

/** Ranks candidates of one subject, optionally partitioned by class. */
export function computeRankings(
  candidates: readonly RankCandidate[],
  scope: RankingScope,
  tiePolicy: TiePolicy,
): RankedEntry[] {
  if (scope === "SUBJECT_ONLY") {
    return rankGroup(candidates, tiePolicy).map((r) => ({ ...r, group: null }));
  }
  const byClass = new Map<number, RankCandidate[]>();
  for (const c of candidates) {
    const list = byClass.get(c.classGrade) ?? [];
    list.push(c);
    byClass.set(c.classGrade, list);
  }
  return [...byClass.keys()]
    .sort((a, b) => a - b)
    .flatMap((grade) =>
      rankGroup(byClass.get(grade)!, tiePolicy).map((r) => ({ ...r, group: grade })),
    );
}
