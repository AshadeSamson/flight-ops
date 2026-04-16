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
  if (!date) {
    throw new Error("Invalid or missing date");
  }

  // ✅ Expecting YYYY-MM-DD
  const [year, month, day] = date.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  // ✅ Lagos midnight converted to UTC
  const startOfDay = new Date(
    Date.UTC(year, month - 1, day, -1, 0, 0)
  );

  // ✅ Next Lagos midnight converted to UTC
  const endOfDay = new Date(
    Date.UTC(year, month - 1, day + 1, -1, 0, 0)
  );

  const skip = (page - 1) * limit;

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
      aircraftType: operation?.aircraft?.type || null,

      bayName: operation?.bay?.name || null,

      delayMinutes,
      delayStatus,
    };
  });

  const filteredData = filters?.status
    ? merged.filter(
        (row) =>
          row.delayStatus ===
          filters.status?.toUpperCase()
      )
    : merged;

  const total = filteredData.length;

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
      totalPages: Math.ceil(total / limit),
    },
  };
}