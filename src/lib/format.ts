export const TBA = "To Be Announced";

const IST = "Asia/Kolkata";

export function formatDate(d: Date | string | null | undefined, fallback = TBA): string {
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: IST }).format(
    new Date(d),
  );
}

export function formatDateTime(d: Date | string | null | undefined, fallback = "—"): string {
  if (!d) return fallback;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: IST,
  }).format(new Date(d));
}

export function orTBA<T>(value: T | null | undefined, render: (v: T) => string = String): string {
  return value === null || value === undefined || value === "" ? TBA : render(value);
}

export function classLabel(grade: number): string {
  return `Class ${grade}`;
}

/** "Aarav Kumar Sharma" → "A. K. S." — for public verification without full names. */
export function maskName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}.`)
    .join(" ");
}

export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
}
