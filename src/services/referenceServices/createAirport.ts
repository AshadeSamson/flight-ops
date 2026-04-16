import { prisma } from "../../config/prisma";

export default async function createAirport(
  body: {
    name: string;
    code: string;
  }
) {
  const name = body.name.trim();
  const code = body.code.trim().toUpperCase();

  const existing = await prisma.airport.findUnique({
    where: { code },
  });

  if (existing) {
    throw new Error("Airport code already exists");
  }

  return prisma.airport.create({
    data: {
      name,
      code,
    },
  });
}