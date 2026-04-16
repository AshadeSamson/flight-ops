import { prisma } from "../../config/prisma";

export default async function updateAirline(
  id: string,
  body: {
    name?: string;
    code?: string;
  }
) {
  const existing = await prisma.airline.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Airline not found");
  }

  const code = body.code?.trim().toUpperCase();

  if (code) {
    const duplicate =
      await prisma.airline.findFirst({
        where: {
          code,
          NOT: { id },
        },
      });

    if (duplicate) {
      throw new Error(
        "Another airline already uses this code"
      );
    }
  }

  return prisma.airline.update({
    where: { id },
    data: {
      ...(body.name && {
        name: body.name.trim(),
      }),
      ...(code && { code }),
    },
  });
}