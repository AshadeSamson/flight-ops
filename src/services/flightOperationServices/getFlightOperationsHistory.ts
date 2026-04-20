import { prisma } from "../../config/prisma";

export default async function getFlightOperationsHistory(
  params: {
    startDate: string;
    endDate: string;
    page?: number;
    limit?: number;
    movementType?: "ARRIVAL" | "DEPARTURE";
    airlineCode?: string;
    status?: string;
    search?: string;
  }
) {
  const {
    startDate,
    endDate,
    movementType,
    airlineCode,
    status,
    search,
  } = params;

  let page = Number(params.page) || 1;
  let limit = Number(params.limit) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 20;

  const skip = (page - 1) * limit;

  const start = new Date(
    `${startDate}T00:00:00.000Z`
  );

  const end = new Date(
    `${endDate}T23:59:59.999Z`
  );

  const where: any = {
    date: {
      gte: start,
      lte: end,
    },
  };

  if (movementType) {
    where.movementType = movementType;
  }

  if (status) {
    where.delayStatus =
      status.toUpperCase();
  }

  if (airlineCode) {
    where.airline = {
      code: airlineCode
        .trim()
        .toUpperCase(),
    };
  }

  if (search) {
    where.OR = [
      {
        flightNumber: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  const total =
    await prisma.flightOperation.count({
      where,
    });

  const data =
    await prisma.flightOperation.findMany({
      where,
      include: {
        airline: true,
        aircraft: true,
        bay: true,
        airport: true,
      },
      orderBy: {
        date: "desc",
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