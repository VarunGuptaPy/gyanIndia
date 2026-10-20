import type { Prisma, PrismaClient } from "@prisma/client";
import { db } from "./db";

type Tx = Prisma.TransactionClient | PrismaClient;

/**
 * Records a sensitive action. Metadata must never contain children's personal data,
 * passwords or payment credentials — store identifiers and counts only.
 */
export async function audit(
  entry: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Prisma.InputJsonValue;
    ipHash?: string | null;
  },
  tx: Tx = db,
) {
  await tx.auditLog.create({
    data: {
      actorId: entry.actorId ?? null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata,
      ipHash: entry.ipHash ?? null,
    },
  });
}
