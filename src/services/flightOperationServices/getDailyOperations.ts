import { prisma } from "../../config/prisma";
import {
  buildScheduledDateTime,
  calculateDelayMinutes,
  getDelayStatus,
} from "../../utils/flightMetrics";

export default async function getDailyOperations(
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
  // ✅ Clean incoming values
  const cleanDate = String(date).trim();

  if (!cleanDate) {
    throw new Error("Date is required");
  }

  // ✅ Strict YYYY-MM-DD validation
  const dateMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!dateMatch) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);

  // ✅ Safe pagination defaults
  page = Number(page) || 1;
  limit = Number(limit) || 20;

  if (page < 1) page = 1;
  if (limit < 1) limit = 20;

  const skip = (page - 1) * limit;

  // ✅ Lagos operational day stored as UTC equivalent
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
    where.movementType = filters.movementType;
  }

  if (filters?.airlineCode) {
    where.airlineCode = filters.airlineCode;
  }

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
    ];
  }

  // ✅ Fetch schedules first (full set for accurate filtering)
  const schedules = await prisma.dailyFlightSchedule.findMany({
    where,
    orderBy: {
      scheduledTime: "asc",
    },
  });

  const operations = await prisma.flightOperation.findMany({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      aircraft: true,
      bay: true,
    },
  });

  const merged = schedules.map((flight) => {
    const operation = operations.find(
      (op) =>
        op.flightNumber === flight.flightNumber &&
        op.movementType === flight.movementType
    );

    const scheduledDateTime = buildScheduledDateTime(
      startOfDay,
      flight.scheduledTime
    );

    const delayMinutes =
      operation?.delayMinutes ??
      calculateDelayMinutes(
        scheduledDateTime,
        operation?.actualTime
      );

    const delayStatus =
      operation?.delayStatus ??
      getDelayStatus(delayMinutes);

    return {
      scheduleId: flight.id,
      flightNumber: flight.flightNumber,
      airlineCode: flight.airlineCode,
      airportName: flight.airportName,
      scheduledTime: flight.scheduledTime,
      movementType: flight.movementType,

      operationId: operation?.id || null,
      soulsOnBoard: operation?.soulsOnBoard || null,
      actualTime: operation?.actualTime || null,

      aircraftReg:
        operation?.aircraft?.registrationNumber || null,
      aircraftType:
        operation?.aircraft?.type || null,

      bayName: operation?.bay?.name || null,

      delayMinutes,
      delayStatus,
    };
  });

  // ✅ Status filtering
  const filteredData = filters?.status
    ? merged.filter(
        (row) =>
          row.delayStatus ===
          String(filters.status).toUpperCase()
      )
    : merged;

  const total = filteredData.length;
  const totalPages =
    total === 0 ? 1 : Math.ceil(total / limit);

  const paginated = filteredData.slice(
    skip,
    skip + limit
  );

  return {
    data: paginated,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}