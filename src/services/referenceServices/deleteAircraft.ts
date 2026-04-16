import { prisma } from "../../config/prisma";

export default async function deleteAircraft(
  id: string
) {
  const existing = await prisma.aircraft.findUnique({
    where: { id },
    include: {
      flights: true,
    },
  });

  if (!existing) {
    throw new Error("Aircraft not found");
  }

  if (existing.flights.length > 0) {
    throw new Error(
      "Cannot delete aircraft currently in use"
    );
  }

  await prisma.aircraft.delete({
    where: { id },
  });
}