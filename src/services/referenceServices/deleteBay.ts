import { prisma } from "../../config/prisma";

export default async function deleteBay(
  id: string
) {
  const existing = await prisma.bay.findUnique({
    where: { id },
    include: {
      flights: true,
    },
  });

  if (!existing) {
    throw new Error("Bay not found");
  }

  if (existing.flights.length > 0) {
    throw new Error(
      "Cannot delete bay currently in use"
    );
  }

  await prisma.bay.delete({
    where: { id },
  });
}