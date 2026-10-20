import "server-only";
import type { Prisma } from "@prisma/client";

export function studentWhere(sp: { q?: string; cls?: string; state?: string }): Prisma.StudentWhereInput {
  const q = sp.q?.trim();
  const cls = Number(sp.cls);
  return {
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { schoolName: { contains: q, mode: "insensitive" } },
            { registrations: { some: { registrationNumber: { contains: q.toUpperCase() } } } },
          ],
        }
      : {}),
    ...(Number.isInteger(cls) && cls > 0 ? { classGrade: cls } : {}),
    ...(sp.state ? { state: sp.state } : {}),
  };
}
