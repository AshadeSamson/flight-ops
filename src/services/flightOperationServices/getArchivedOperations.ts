import { prisma } from "../../config/prisma";
import {
  getNextLagosDayAnchor,
  parseLagosDateOnly,
} from "../../utils/lagosDate";

export default async function getArchivedOperations(
  page: number = 1,

  limit: number | string = 20,

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
  // -----------------------------------
  // PAGINATION
  // -----------------------------------

  page = Number(page) || 1;

  if (page < 1) page = 1;

  const fetchAll =
    String(limit).trim().toLowerCase() ===
    "all";

  const parsedLimit = fetchAll
    ? null
    : Number(limit) || 20;

  const safeLimit =
    parsedLimit && parsedLimit > 0
      ? parsedLimit
      : 20;

  const skip = fetchAll
    ? undefined
    : (page - 1) * safeLimit;

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
    const start =
      parseLagosDateOnly(
        filters.startDate
      );

    const end =
      getNextLagosDayAnchor(
        parseLagosDateOnly(
          filters.endDate
        )
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

        ...(fetchAll
          ? {}
          : {
              skip,

              take: safeLimit,
            }),
      }
    );

  // -----------------------------------
  // META
  // -----------------------------------

  const totalPages = fetchAll
    ? 1
    : total === 0
    ? 1
    : Math.ceil(
        total / safeLimit
      );

  return {
    data,

    meta: {
      total,

      page,

      limit: fetchAll
        ? "all"
        : safeLimit,

      totalPages,

      hasNextPage: fetchAll
        ? false
        : page < totalPages,

      hasPrevPage: fetchAll
        ? false
        : page > 1,
    },
  };
}
