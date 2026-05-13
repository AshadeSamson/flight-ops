import { prisma } from "../../config/prisma";
import buildOperationsMetrics from "../../lib/buildOperationsMetrics";

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

  const endOfDay = new Date(
    startOfDay
  );

  endOfDay.setUTCDate(
    endOfDay.getUTCDate() + 1
  );

  const whereDate = {
    gte: startOfDay,
    lt: endOfDay,
  };

  // -----------------------------------
  // CURRENT DAILY BOARD
  // -----------------------------------

  const schedules =
    await prisma.dailyFlightSchedule.findMany(
      {
        where: {
          date: whereDate,
        },
      }
    );

  const operations =
    await prisma.flightOperation.findMany({
      where: {
        date: whereDate,
      },

      include: {
        aircraft: true,
        bay: true,
        airport: true,
      },
    });

  // -----------------------------------
  // AIRLINE LOOKUP
  // -----------------------------------

  const airlineCodes = [
    ...new Set(
      schedules
        .map((s) => s.airlineCode)
        .filter(Boolean)
    ),
  ] as string[];

  const airlines =
    await prisma.airline.findMany({
      where: {
        code: {
          in: airlineCodes,
        },
      },
    });

  const airlineMap = new Map(
    airlines.map((airline) => [
      airline.code,
      airline,
    ])
  );

  // -----------------------------------
  // OPERATION LOOKUP
  // -----------------------------------

  const operationMap = new Map(
    operations.map((op) => [
      `${op.flightNumber}-${op.movementType}`,
      op,
    ])
  );

  const currentRows = schedules.map(
    (flight) => {
      const operation =
        operationMap.get(
          `${flight.flightNumber}-${flight.movementType}`
        );

      const airline =
        flight.airlineCode
          ? airlineMap.get(
              flight.airlineCode
            )
          : null;

      return {
        flightNumber:
          flight.flightNumber,

        movementType:
          flight.movementType,

        airportName:
          flight.airportName,

        scheduledTime:
          flight.scheduledTime,

        actualTime:
          operation?.actualTime ||
          null,

        aircraftReg:
          operation?.aircraft
            ?.registrationNumber ||
          null,

        bayName:
          operation?.bay?.name ||
          null,

        soulsOnBoard:
          operation?.soulsOnBoard ||
          0,

        airlineCode:
          flight.airlineCode,

        airlineName:
          airline?.name || null,

        delayStatus:
          operation?.delayStatus ||
          "PENDING",
      };
    }
  );

  // -----------------------------------
  // ARCHIVE BOARD
  // -----------------------------------

  const archivedOperations =
    await prisma.archivedDailyOperation.findMany();

  const archiveAirlineCodes = [
    ...new Set(
      archivedOperations
        .map((row) => row.airlineCode)
        .filter(Boolean)
    ),
  ] as string[];

  const archiveAirlines =
    await prisma.airline.findMany({
      where: {
        code: {
          in: archiveAirlineCodes,
        },
      },
    });

  const archiveAirlineMap = new Map(
    archiveAirlines.map((airline) => [
      airline.code,
      airline,
    ])
  );

  const archiveRows =
    archivedOperations.map((row) => {
      const airline =
        row.airlineCode
          ? archiveAirlineMap.get(
              row.airlineCode
            )
          : null;

      return {
        ...row,

        airlineName:
          airline?.name || null,
      };
    });

  // -----------------------------------
  // BUILD METRICS
  // -----------------------------------

  const currentDay =
    buildOperationsMetrics(
      currentRows
    );

  const archiveDay =
    buildOperationsMetrics(
      archiveRows
    );

  // -----------------------------------
  // SOB TOTALS
  // -----------------------------------

  const totalArrivalSOB =
    currentRows
      .filter(
        (row) =>
          row.movementType ===
          "ARRIVAL"
      )
      .reduce(
        (sum, row) =>
          sum +
          (row.soulsOnBoard || 0),
        0
      );

  const totalDepartureSOB =
    currentRows
      .filter(
        (row) =>
          row.movementType ===
          "DEPARTURE"
      )
      .reduce(
        (sum, row) =>
          sum +
          (row.soulsOnBoard || 0),
        0
      );

  // -----------------------------------
  // AIRLINE FLIGHT DETAILS
  // -----------------------------------

  const airlineBreakdownMap =
    new Map();

  currentRows.forEach((row) => {
    const key =
      row.airlineCode || "UNKNOWN";

    if (
      !airlineBreakdownMap.has(key)
    ) {
      airlineBreakdownMap.set(key, {
        airlineCode:
          row.airlineCode,

        airlineName:
          row.airlineName,

        flights: [],
      });
    }

    airlineBreakdownMap
      .get(key)
      .flights.push({
        flightNumber:
          row.flightNumber,

        type:
          row.movementType,

        airport:
          row.airportName,

        scheduled:
          row.scheduledTime,

        actual:
          row.actualTime,

        aircraftReg:
          row.aircraftReg,

        bay:
          row.bayName,

        soulsOnBoard:
          row.soulsOnBoard,
      });
  });

  const airlineFlightBreakdown =
    Array.from(
      airlineBreakdownMap.values()
    );

  return {
    currentDay,

    archiveDay,

    // ✅ New SOB metrics
    soulsOnBoard: {
      arrivals:
        totalArrivalSOB,

      departures:
        totalDepartureSOB,
    },

    // ✅ New airline flight details
    airlineFlightBreakdown,
  };
}