import { prisma } from "../../config/prisma";

export default async function deleteAirline(
  id: string
) {
  const existing = await prisma.airline.findUnique({
    where: { id },
    include: {
      aircrafts: true,
      flights: true,
    },
  });

  if (!existing) {
    throw new Error("Airline not found");
  }

  if (
    existing.aircrafts.length > 0 ||
    existing.flights.length > 0
  ) {
    throw new Error(
      "Cannot delete airline currently in use"
    );
  }

  await prisma.airline.delete({
    where: { id },
  });
}