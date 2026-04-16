import { prisma } from "../../config/prisma";
import { buildScheduledDateTime, calculateDelayMinutes, getDelayStatus} from "../../utils/flightMetrics";

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
  const inputDate = new Date(date);

  if (!date || isNaN(inputDate.getTime())) {
    throw new Error("Invalid or missing date");
  }

  const lagosDate = new Date(
    inputDate.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );

  const startOfDay = new Date(
    lagosDate.getFullYear(),
    lagosDate.getMonth(),
    lagosDate.getDate()
  );

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const skip = (page - 1) * limit;

  // 🧠 Build WHERE condition dynamically
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

  if (filters?.status) {
    filters.status = filters.status.toUpperCase() as any;
  }

  // 🟢 Total count
  const total = await prisma.dailyFlightSchedule.count({ where });

  // 🟢 Paginated schedules
  const schedules = await prisma.dailyFlightSchedule.findMany({
    where,
    orderBy: {
      scheduledTime: "asc",
    },
    skip,
    take: limit,
  });

  // 🟢 Fetch operations
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

  // 🧠 Merge
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

    const delayMinutes = calculateDelayMinutes(
      scheduledDateTime,
      operation?.actualTime
    );

    const delayStatus = getDelayStatus(delayMinutes);

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

      aircraftReg: operation?.aircraft?.registrationNumber || null,
      aircraftType: operation?.aircraft?.type || null,

      bayName: operation?.bay?.name || null,

      delayMinutes: operation?.delayMinutes ?? null,
      delayStatus: operation?.delayStatus ?? "PENDING",
    };
  });

  const filteredData = filters?.status
  ? merged.filter((f) => f.delayStatus === filters.status)
  : merged;

  const paginated = filteredData.slice(skip, skip + limit);

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