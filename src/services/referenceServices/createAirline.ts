import { prisma } from "../../config/prisma";

export default async function createAirline(
  body: {
    name: string;
    code: string;
  }
) {
  const name = body.name.trim();
  const code = body.code.trim().toUpperCase();

  const exists = await prisma.airline.findUnique({
    where: { code },
  });

  if (exists) {
    throw new Error("Airline code already exists");
  }

  return prisma.airline.create({
    data: {
      name,
      code,
    },
  });
}