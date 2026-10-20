import type { Prisma } from "@prisma/client";

/** Atomically increments and returns a named counter inside a transaction. */
export async function nextCounter(tx: Prisma.TransactionClient, key: string): Promise<number> {
  const row = await tx.counter.upsert({
    where: { key },
    create: { key, value: 1 },
    update: { value: { increment: 1 } },
  });
  return row.value;
}

export function registrationNumberFor(year: number, n: number) {
  return `NTHE${String(year).slice(-2)}-${String(n).padStart(6, "0")}`;
}

export function admitCardNumberFor(year: number, n: number) {
  return `NTHE${String(year).slice(-2)}-AC-${String(n).padStart(6, "0")}`;
}
