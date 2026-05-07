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
    });

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

      return {
        movementType:
          flight.movementType,

        airlineCode:
          flight.airlineCode,

        delayStatus:
          operation?.delayStatus ||
          "PENDING",

        actualTime:
          operation?.actualTime ||
          null,
      };
    }
  );

  // -----------------------------------
  // ARCHIVE BOARD
  // -----------------------------------

  const archiveRows =
    await prisma.archivedDailyOperation.findMany();

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

  return {
    currentDay,

    archiveDay,
  };
}