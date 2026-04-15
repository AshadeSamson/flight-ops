import { prisma } from "../../config/prisma";

export default async function getDailyOperations(date: string) {
  // 🧠 Normalize Lagos date
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

  // 🟢 1. Fetch schedule
  const schedules = await prisma.dailyFlightSchedule.findMany({
    where: {
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    orderBy: {
      scheduledTime: "asc",
    },
  });

  // 🟢 2. Fetch operations WITH relations
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

  // 🧠 3. Merge
  const merged = schedules.map((flight) => {
    const operation = operations.find(
      (op) =>
        op.flightNumber === flight.flightNumber &&
        op.movementType === flight.movementType
    );

    return {
      // 🔹 Schedule data
      scheduleId: flight.id,
      flightNumber: flight.flightNumber,
      airlineCode: flight.airlineCode,
      airportName: flight.airportName,
      scheduledTime: flight.scheduledTime,
      movementType: flight.movementType,

      // 🔹 Operation data (UI-friendly)
      operationId: operation?.id || null,
      soulsOnBoard: operation?.soulsOnBoard || null,
      actualTime: operation?.actualTime || null,

      aircraftReg: operation?.aircraft?.registrationNumber || null,
      aircraftType: operation?.aircraft?.type || null,

      bayName: operation?.bay?.name || null,
    };
  });

  return merged;
}