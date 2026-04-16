import { prisma } from "../../config/prisma";

export default async function getBays() {
  const bays = await prisma.bay.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return bays.map((b) => ({
    id: b.id,
    name: b.name,
    code: b.code,
  }));
}