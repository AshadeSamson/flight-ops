import { prisma } from "../../config/prisma";

export default async function getAirlines() {
  const airlines = await prisma.airline.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return airlines.map((a) => ({
    id: a.id,
    name: a.name,
    code: a.code,
  }));
}