import { prisma } from "../../config/prisma";
import {
  buildScheduledDateTime,
  calculateDelayMinutes,
  getDelayStatus,
} from "../../utils/flightMetrics";
import {
  getNextLagosDayAnchor,
  parseLagosDateOnly,
} from "../../utils/lagosDate";

export default async function getDailyOperations(
  date: string,
  page: number = 1,
  limit: number | string = 20,
  filters?: {
    movementType?: "ARRIVAL" | "DEPARTURE";
    airlineCode?: string;
    search?: string;
    status?: "ON_TIME" | "MINOR_DELAY" | "DELAYED" | "PENDING";
  }
) {
  //  Clean incoming values
  const cleanDate = String(date).trim();

  if (!cleanDate) {
    throw new Error("Date is required");
  }

  const startOfDay = parseLagosDateOnly(cleanDate);

  //  Safe pagination defaults
  const fetchAll =
  String(limit).toLowerCase() === "all";

  page = Number(page) || 1;

  if (page < 1) page = 1;

  const numericLimit = fetchAll
    ? undefined
    : Number(limit) || 20;

  if (
    numericLimit !== undefined &&
    numericLimit < 1
  ) {
    throw new Error(
      "limit must be greater than 0"
    );
  }

  const skip =
    numericLimit !== undefined
      ? (page - 1) * numericLimit
      : 0;

  const endOfDay = getNextLagosDayAnchor(startOfDay);

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

  //  Fetch schedules first (full set for accurate filtering)
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

  //  Status filtering
  const filteredData = filters?.status
    ? merged.filter(
        (row) =>
          row.delayStatus ===
          String(filters.status).toUpperCase()
      )
    : merged;

  const total = filteredData.length;

  const totalPages =
  numericLimit === undefined
    ? 1
    : total === 0
    ? 1
    : Math.ceil(total / numericLimit);

  const paginated =
    numericLimit === undefined
      ? filteredData
      : filteredData.slice(
          skip,
          skip + numericLimit
        );

  return {
    data: paginated,
    meta: {
      total,
      page,
      limit:
        numericLimit === undefined
          ? total
          : numericLimit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
