import { prisma } from "../../config/prisma";

export default async function getAircrafts() {
  const aircrafts = await prisma.aircraft.findMany({
    include: {
      airline: true,
    },
    orderBy: {
      registrationNumber: "asc",
    },
  });

  return aircrafts.map((a) => ({
    id: a.id, // optional (can be useful later)
    registrationNumber: a.registrationNumber,
    type: a.type,
    maxCapacity: a.maxCapacity,
    airlineCode: a.airline.code,
    airlineName: a.airline.name,
  }));
}