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
  endOfDay.setUTCDate(
    endOfDay.getUTCDate() + 1
  );

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

    // ✅ Status breakdown
    onTimeCount,
    minorDelayCount,
    delayedCount,
    cancelledCount,

    // ✅ Airline breakdown
    airlineBreakdown,
  ] = await Promise.all([
    prisma.dailyFlightSchedule.count({
      where: {
        date: whereDate,
      },
    }),

    prisma.flightOperation.count({
      where: {
        date: whereDate,
        actualTime: {
          not: null,
        },
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

    // ✅ ON_TIME
    prisma.flightOperation.count({
      where: {
        date: whereDate,
        delayStatus: "ON_TIME",
      },
    }),

    // ✅ MINOR_DELAY
    prisma.flightOperation.count({
      where: {
        date: whereDate,
        delayStatus: "MINOR_DELAY",
      },
    }),

    // ✅ DELAYED
    prisma.flightOperation.count({
      where: {
        date: whereDate,
        delayStatus: "DELAYED",
      },
    }),

    // ✅ CANCELLED
    prisma.flightOperation.count({
      where: {
        date: whereDate,
        delayStatus: "CANCELLED",
      },
    }),

    // ✅ Airline breakdown
    prisma.flightOperation.groupBy({
      by: ["airlineId"],

      where: {
        date: whereDate,
      },

      _count: {
        airlineId: true,
      },
    }),
  ]);

  // ✅ Resolve airline names
  const airlineIds = airlineBreakdown
    .map((item) => item.airlineId)
    .filter(Boolean) as string[];

  const airlines =
    await prisma.airline.findMany({
      where: {
        id: {
          in: airlineIds,
        },
      },
    });

  const airlineMap = new Map(
    airlines.map((airline) => [
      airline.id,
      airline,
    ])
  );

  const formattedAirlineBreakdown =
    airlineBreakdown.map((item) => {
      const airline = item.airlineId
        ? airlineMap.get(item.airlineId)
        : null;

      return {
        airlineId: item.airlineId,
        airlineName:
          airline?.name || "Unknown",
        airlineCode:
          airline?.code || null,
        totalFlights:
          item._count.airlineId,
      };
    });

  return {
    totalScheduled,

    completed,

    pending:
      totalScheduled - completed,

    delayed,

    arrivals,

    departures,

    // ✅ Status breakdown
    statusBreakdown: {
      onTime: onTimeCount,
      minorDelay: minorDelayCount,
      delayed: delayedCount,
      cancelled: cancelledCount,
    },

    // ✅ Airline breakdown
    airlineBreakdown:
      formattedAirlineBreakdown,
  };
}