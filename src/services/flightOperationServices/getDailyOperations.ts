import { prisma } from "../../config/prisma";

export default async function getDailyOperations(
  date: string,
  page: number = 1,
  limit: number = 20,
  filters?: {
    movementType?: "ARRIVAL" | "DEPARTURE";
    airlineCode?: string;
    search?: string;
  }
) {
  const inputDate = new Date(date);

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
    };
  });

  return {
    data: merged,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}