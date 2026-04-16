import { prisma } from "../../config/prisma";

export default async function createAircraft(
  body: {
    registrationNumber: string;
    type: string;
    maxCapacity: number;
    airlineCode: string;
  }
) {
  const registrationNumber =
    body.registrationNumber.trim().toUpperCase();

  const type = body.type.trim();

  const airlineCode =
    body.airlineCode.trim().toUpperCase();

  const airline = await prisma.airline.findUnique({
    where: { code: airlineCode },
  });

  if (!airline) {
    throw new Error("Airline not found");
  }

  const existing = await prisma.aircraft.findUnique({
    where: { registrationNumber },
  });

  if (existing) {
    throw new Error(
      "Aircraft registration already exists"
    );
  }

  return prisma.aircraft.create({
    data: {
      registrationNumber,
      type,
      maxCapacity: Number(body.maxCapacity),
      airlineId: airline.id,
    },
  });
}