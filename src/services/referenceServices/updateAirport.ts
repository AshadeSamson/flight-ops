import { prisma } from "../../config/prisma";

export default async function updateAirport(
  id: string,
  body: {
    name?: string;
    code?: string;
  }
) {
  const existing = await prisma.airport.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Airport not found");
  }

  const name = body.name?.trim();
  const code =
    body.code?.trim().toUpperCase();

  if (code) {
    const duplicate =
      await prisma.airport.findFirst({
        where: {
          code,
          NOT: { id },
        },
      });

    if (duplicate) {
      throw new Error(
        "Another airport already uses this code"
      );
    }
  }

  return prisma.airport.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(code && { code }),
    },
  });
}