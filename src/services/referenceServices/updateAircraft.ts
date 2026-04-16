import { prisma } from "../../config/prisma";

export default async function updateAircraft(
  id: string,
  body: {
    registrationNumber?: string;
    type?: string;
    maxCapacity?: number;
    airlineCode?: string;
  }
) {
  const existing = await prisma.aircraft.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Aircraft not found");
  }

  let airlineId: string | undefined;

  if (body.airlineCode) {
    const airline =
      await prisma.airline.findUnique({
        where: {
          code: body.airlineCode
            .trim()
            .toUpperCase(),
        },
      });

    if (!airline) {
      throw new Error("Airline not found");
    }

    airlineId = airline.id;
  }

  const registrationNumber =
    body.registrationNumber
      ?.trim()
      .toUpperCase();

  if (registrationNumber) {
    const duplicate =
      await prisma.aircraft.findFirst({
        where: {
          registrationNumber,
          NOT: { id },
        },
      });

    if (duplicate) {
      throw new Error(
        "Another aircraft already uses this registration"
      );
    }
  }

  return prisma.aircraft.update({
    where: { id },
    data: {
      ...(registrationNumber && {
        registrationNumber,
      }),
      ...(body.type && {
        type: body.type.trim(),
      }),
      ...(body.maxCapacity && {
        maxCapacity: Number(body.maxCapacity),
      }),
      ...(airlineId && { airlineId }),
    },
  });
}