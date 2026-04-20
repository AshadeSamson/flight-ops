import { prisma } from "../../config/prisma";

export default async function getFlightOperations(
  date: string,
  page: number = 1,
  limit: number = 20,
  filters?: {
    movementType?: "ARRIVAL" | "DEPARTURE";
    airlineCode?: string;
    search?: string;
    status?: "ON_TIME" | "MINOR_DELAY" | "DELAYED" | "PENDING";
  }
) {
  const cleanDate = String(date).trim();

  if (!cleanDate) {
    throw new Error("Date is required");
  }

  const match = cleanDate.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    throw new Error(
      "Invalid date format. Use YYYY-MM-DD"
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  page = Number(page) || 1;
  limit = Number(limit) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 20;

  const skip = (page - 1) * limit;

  // Lagos day boundaries stored as UTC equivalent
  const startOfDay = new Date(
    Date.UTC(year, month - 1, day, -1, 0, 0)
  );

  const endOfDay = new Date(
    Date.UTC(year, month - 1, day + 1, -1, 0, 0)
  );

  const where: any = {
    date: {
      gte: startOfDay,
      lt: endOfDay,
    },
  };

  if (filters?.movementType) {
    where.movementType =
      filters.movementType;
  }

  if (filters?.status) {
    where.delayStatus =
      String(filters.status).toUpperCase();
  }

  if (filters?.airlineCode) {
    where.airline = {
      code: filters.airlineCode
        .trim()
        .toUpperCase(),
    };
  }

  if (filters?.search) {
    where.OR = [
      {
        flightNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  const total =
    await prisma.flightOperation.count({
      where,
    });

  const operations =
    await prisma.flightOperation.findMany({
      where,
      include: {
        airline: true,
        aircraft: true,
        bay: true,
        airport: true,
      },
      orderBy: [
        { scheduledTime: "asc" },
      ],
      skip,
      take: limit,
    });

  return {
    data: operations,
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