import { prisma } from "../../config/prisma";

export default async function getArchivedOperations(
  page: number = 1,
  limit: number = 20
) {
  page = Number(page) || 1;

  limit = Number(limit) || 20;

  const skip = (page - 1) * limit;

  const total =
    await prisma.archivedDailyOperation.count();

  const data =
    await prisma.archivedDailyOperation.findMany({
      orderBy: {
        scheduledTime: "asc",
      },

      skip,

      take: limit,
    });

  return {
    data,

    meta: {
      total,

      page,

      limit,

      totalPages:
        total === 0
          ? 1
          : Math.ceil(total / limit),

      hasNextPage:
        skip + limit < total,

      hasPrevPage: page > 1,
    },
  };
}