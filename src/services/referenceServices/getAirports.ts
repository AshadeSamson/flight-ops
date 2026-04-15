import { prisma } from "../../config/prisma";

export default async function getAirports() {
  const airports = await prisma.airport.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return airports.map((a) => ({
    id: a.id,
    name: a.name,
    code: a.code,
  }));
}