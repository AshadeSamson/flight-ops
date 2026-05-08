import { prisma } from "../../config/prisma";

type CreateAuditLogParams = {
  userId?: string;

  action: string;
  module: string;

  description?: string;

  entityType?: string;
  entityId?: string;

  metadata?: any;

  ipAddress?: string;
  userAgent?: string;
};

export default async function createAuditLog({
  userId,

  action,
  module,

  description,

  entityType,
  entityId,

  metadata,

  ipAddress,
  userAgent,
}: CreateAuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,

        action,
        module,

        description,

        entityType,
        entityId,

        metadata,

        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error(
      "Failed to create audit log:",
      error
    );
  }
}