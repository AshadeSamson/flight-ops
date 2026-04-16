import { prisma } from "../../config/prisma";

export default async function createBay(
  body: {
    name: string;
    code: string;
  }
) {
  const name = body.name.trim();
  const code = body.code.trim().toUpperCase();

  const duplicateName =
    await prisma.bay.findUnique({
      where: { name },
    });

  if (duplicateName) {
    throw new Error("Bay name already exists");
  }

  const duplicateCode =
    await prisma.bay.findUnique({
      where: { code },
    });

  if (duplicateCode) {
    throw new Error("Bay code already exists");
  }

  return prisma.bay.create({
    data: {
      name,
      code,
    },
  });
}