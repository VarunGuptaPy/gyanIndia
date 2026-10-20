// Fee calculation. All amounts are integer paise.
// Total = registration fee + Σ subject fees. The server recomputes this from the
// database for every order — client-submitted amounts are never trusted.

export const DEFAULT_REGISTRATION_FEE_PAISE = 50_00;
export const DEFAULT_SUBJECT_FEE_PAISE = 250_00;

export type FeeSubject = { id: string; feePaise: number };

export type FeeBreakdown = {
  registrationFeePaise: number;
  subjectsFeePaise: number;
  totalPaise: number;
  subjectCount: number;
  lines: { id: string; feePaise: number }[];
};

export class FeeError extends Error {}

/**
 * Calculates the payable amount for a set of selected subject ids against the
 * available subjects. Throws on empty, duplicate or unknown selections.
 */
export function calculateFees(
  selectedIds: readonly string[],
  available: readonly FeeSubject[],
  registrationFeePaise: number,
): FeeBreakdown {
  if (selectedIds.length === 0) throw new FeeError("Select at least one subject.");
  if (new Set(selectedIds).size !== selectedIds.length) {
    throw new FeeError("A subject cannot be selected more than once.");
  }
  assertPaise(registrationFeePaise);

  const byId = new Map(available.map((s) => [s.id, s]));
  const lines = selectedIds.map((id) => {
    const subject = byId.get(id);
    if (!subject) throw new FeeError("One or more selected subjects are not available.");
    assertPaise(subject.feePaise);
    return { id, feePaise: subject.feePaise };
  });

  const subjectsFeePaise = lines.reduce((sum, l) => sum + l.feePaise, 0);
  return {
    registrationFeePaise,
    subjectsFeePaise,
    totalPaise: registrationFeePaise + subjectsFeePaise,
    subjectCount: lines.length,
    lines,
  };
}

/** Simple formula used by the public calculator when every subject has the same fee. */
export function totalForSubjectCount(
  count: number,
  registrationFeePaise = DEFAULT_REGISTRATION_FEE_PAISE,
  subjectFeePaise = DEFAULT_SUBJECT_FEE_PAISE,
): number {
  if (!Number.isInteger(count) || count < 0) throw new FeeError("Invalid subject count.");
  if (count === 0) return 0;
  return registrationFeePaise + subjectFeePaise * count;
}

function assertPaise(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new FeeError("Invalid fee configuration.");
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPaise(paise: number): string {
  return inr.format(paise / 100);
}
