import Papa from "papaparse";

// CSV result import validation. Expected header:
//   registration_number,marks,status
// status is optional: PRESENT (default) | ABSENT | WITHHELD. Marks are required for PRESENT.

export type ImportRowStatus = "PRESENT" | "ABSENT" | "WITHHELD";

export type ValidImportRow = {
  line: number;
  registrationNumber: string;
  registrationSubjectId: string;
  marks: string | null;
  status: ImportRowStatus;
};

export type ImportRowError = { line: number; registrationNumber: string; error: string };

export type ImportValidation = {
  valid: ValidImportRow[];
  errors: ImportRowError[];
  rowCount: number;
};

export const MAX_IMPORT_ROWS = 50_000;
const REQUIRED_HEADERS = ["registration_number", "marks"];

/**
 * @param csvText raw CSV
 * @param maxMarks maximum marks for the subject
 * @param enrolled map of registration number → registrationSubjectId for confirmed
 *        registrations that include this subject
 */
export function validateResultCsv(
  csvText: string,
  maxMarks: number,
  enrolled: ReadonlyMap<string, string>,
): ImportValidation {
  const parsed = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length) {
    return {
      valid: [],
      errors: [{ line: 1, registrationNumber: "", error: `Missing column(s): ${missing.join(", ")}` }],
      rowCount: 0,
    };
  }
  if (parsed.data.length > MAX_IMPORT_ROWS) {
    return {
      valid: [],
      errors: [{ line: 1, registrationNumber: "", error: `File exceeds ${MAX_IMPORT_ROWS} rows.` }],
      rowCount: parsed.data.length,
    };
  }

  const valid: ValidImportRow[] = [];
  const errors: ImportRowError[] = [];
  const seen = new Map<string, number>();

  parsed.data.forEach((row, i) => {
    const line = i + 2; // header is line 1
    const registrationNumber = (row.registration_number ?? "").trim().toUpperCase();
    const marksRaw = (row.marks ?? "").trim();
    const statusRaw = (row.status ?? "").trim().toUpperCase() || "PRESENT";
    const fail = (error: string) => errors.push({ line, registrationNumber, error });

    if (!registrationNumber) return fail("Registration number is missing.");
    if (seen.has(registrationNumber)) {
      return fail(`Duplicate of line ${seen.get(registrationNumber)}.`);
    }
    seen.set(registrationNumber, line);

    const registrationSubjectId = enrolled.get(registrationNumber);
    if (!registrationSubjectId) {
      return fail("No confirmed registration for this subject with this number.");
    }
    if (!["PRESENT", "ABSENT", "WITHHELD"].includes(statusRaw)) {
      return fail("Status must be PRESENT, ABSENT or WITHHELD.");
    }
    const status = statusRaw as ImportRowStatus;

    if (status !== "PRESENT") {
      if (marksRaw) return fail(`Marks must be empty when status is ${status}.`);
      return valid.push({ line, registrationNumber, registrationSubjectId, marks: null, status });
    }

    if (!/^\d+(\.\d{1,2})?$/.test(marksRaw)) {
      return fail("Marks must be a non-negative number with at most 2 decimal places.");
    }
    if (Number(marksRaw) > maxMarks) return fail(`Marks exceed the maximum of ${maxMarks}.`);
    valid.push({ line, registrationNumber, registrationSubjectId, marks: marksRaw, status });
  });

  return { valid, errors, rowCount: parsed.data.length };
}
