import { prisma } from "../../config/prisma";

export default async function getTodaySummary() {
  const now = new Date();

  const lagosNow = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
    })
  );

  const startOfDay = new Date(
    Date.UTC(
      lagosNow.getFullYear(),
      lagosNow.getMonth(),
      lagosNow.getDate(),
      -1,
      0,
      0
    )
  );

  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

  const whereDate = {
    gte: startOfDay,
    lt: endOfDay,
  };

  const [
    totalScheduled,
    completed,
    delayed,
    arrivals,
    departures,
  ] = await Promise.all([
    prisma.dailyFlightSchedule.count({
      where: { date: whereDate },
    }),

    prisma.flightOperation.count({
      where: {
        date: whereDate,
        actualTime: { not: null },
      },
    }),

    prisma.flightOperation.count({
      where: {
        date: whereDate,
        delayStatus: "DELAYED",
      },
    }),

    prisma.dailyFlightSchedule.count({
      where: {
        date: whereDate,
        movementType: "ARRIVAL",
      },
    }),

    prisma.dailyFlightSchedule.count({
      where: {
        date: whereDate,
        movementType: "DEPARTURE",
      },
    }),
  ]);

  return {
    totalScheduled,
    completed,
    pending: totalScheduled - completed,
    delayed,
    arrivals,
    departures,
  };
}