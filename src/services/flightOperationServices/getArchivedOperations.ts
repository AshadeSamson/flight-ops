import { prisma } from "../../config/prisma";
import {
  getNextLagosDayAnchor,
  parseLagosDateOnly,
} from "../../utils/lagosDate";

export default async function getArchivedOperations(
  page: number = 1,
  limit: number = 20,

  filters?: {
    movementType?: "ARRIVAL" | "DEPARTURE";

    airlineCode?: string;

    search?: string;

    status?:
      | "ON_TIME"
      | "MINOR_DELAY"
      | "DELAYED"
      | "PENDING"
      | "CANCELLED";

    startDate?: string;

    endDate?: string;
  }
) {
  // ✅ Safe pagination
  page = Number(page) || 1;

  limit = Number(limit) || 20;

  if (page < 1) page = 1;

  if (limit < 1) limit = 20;

  const skip = (page - 1) * limit;

  // -----------------------------------
  // WHERE FILTERS
  // -----------------------------------

  const where: any = {};

  // ✅ Movement type
  if (filters?.movementType) {
    where.movementType =
      filters.movementType;
  }

  // ✅ Airline
  if (filters?.airlineCode) {
    where.airlineCode = {
      equals:
        filters.airlineCode.toUpperCase(),
      mode: "insensitive",
    };
  }

  // ✅ Status
  if (filters?.status) {
    where.delayStatus = {
      equals:
        filters.status.toUpperCase(),
      mode: "insensitive",
    };
  }

  // ✅ Search
  if (filters?.search) {
    where.OR = [
      {
        flightNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },

      {
        airportName: {
          contains: filters.search,
          mode: "insensitive",
        },
      },

      {
        aircraftReg: {
          contains: filters.search,
          mode: "insensitive",
        },
      },

      {
        bayName: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  // ✅ Date range
  if (
    filters?.startDate &&
    filters?.endDate
  ) {
    const start = parseLagosDateOnly(filters.startDate);
    const end = getNextLagosDayAnchor(
      parseLagosDateOnly(filters.endDate)
    );

    where.snapshotDate = {
      gte: start,
      lt: end,
    };
  }

  // -----------------------------------
  // TOTAL
  // -----------------------------------

  const total =
    await prisma.archivedDailyOperation.count(
      {
        where,
      }
    );

  // -----------------------------------
  // FETCH
  // -----------------------------------

  const data =
    await prisma.archivedDailyOperation.findMany(
      {
        where,

        orderBy: {
          scheduledTime: "asc",
        },

        skip,

        take: limit,
      }
    );

  // -----------------------------------
  // META
  // -----------------------------------

  const totalPages =
    total === 0
      ? 1
      : Math.ceil(total / limit);

  return {
    data,

    meta: {
      total,

      page,

      limit,

      totalPages,

      hasNextPage:
        page < totalPages,

      hasPrevPage:
        page > 1,
    },
  };
}
