import { prisma } from "../../config/prisma";

export default async function deleteAirport(
  id: string
) {
  const existing =
    await prisma.airport.findUnique({
      where: { id },
      include: {
        flights: true,
      },
    });

  if (!existing) {
    throw new Error("Airport not found");
  }

  if (existing.flights.length > 0) {
    throw new Error(
      "Cannot delete airport currently in use"
    );
  }

  await prisma.airport.delete({
    where: { id },
  });
}