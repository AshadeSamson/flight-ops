import { prisma } from "../../config/prisma";

export default async function updateBay(
  id: string,
  body: {
    name?: string;
    code?: string;
  }
) {
  const existing = await prisma.bay.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Bay not found");
  }

  const name = body.name?.trim();
  const code =
    body.code?.trim().toUpperCase();

  if (name) {
    const duplicate =
      await prisma.bay.findFirst({
        where: {
          name,
          NOT: { id },
        },
      });

    if (duplicate) {
      throw new Error(
        "Another bay already uses this name"
      );
    }
  }

  if (code) {
    const duplicate =
      await prisma.bay.findFirst({
        where: {
          code,
          NOT: { id },
        },
      });

    if (duplicate) {
      throw new Error(
        "Another bay already uses this code"
      );
    }
  }

  return prisma.bay.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(code && { code }),
    },
  });
}