import { prisma } from "../../config/prisma";

import {
  buildScheduledDateTime,
  calculateDelayMinutes,
  getDelayStatus,
} from "../../utils/flightMetrics";

export default async function createArchiveSnapshot() {
  // -----------------------------------
  // GET CURRENT DAILY SCHEDULES
  // -----------------------------------

  const schedules =
    await prisma.dailyFlightSchedule.findMany({
      orderBy: {
        scheduledTime: "asc",
      },
    });

  if (!schedules.length) {
    return;
  }

  // -----------------------------------
  // GET OPERATIONS
  // -----------------------------------

  const operations =
    await prisma.flightOperation.findMany({
      where: {
        OR: schedules.map((flight) => ({
          flightNumber:
            flight.flightNumber,

          movementType:
            flight.movementType,

          date: flight.date,
        })),
      },

      include: {
        aircraft: true,
        bay: true,
      },
    });

  // -----------------------------------
  // CLEAR PREVIOUS ARCHIVE
  // -----------------------------------

  await prisma.archivedDailyOperation.deleteMany(
    {}
  );

  // -----------------------------------
  // BUILD SNAPSHOT
  // -----------------------------------

  const archiveRows = schedules.map(
    (flight) => {
      const operation =
        operations.find(
          (op) =>
            op.flightNumber ===
              flight.flightNumber &&
            op.movementType ===
              flight.movementType
        );

      const scheduledDateTime =
        buildScheduledDateTime(
          flight.date,
          flight.scheduledTime
        );

      const delayMinutes =
        operation?.delayMinutes ??
        calculateDelayMinutes(
          scheduledDateTime,
          operation?.actualTime ||
            undefined
        );

      const delayStatus =
        operation?.delayStatus ??
        getDelayStatus(delayMinutes);

      return {
        snapshotDate: flight.date,

        flightNumber:
          flight.flightNumber,

        movementType:
          flight.movementType,

        airlineCode:
          flight.airlineCode,

        airportName:
          flight.airportName,

        scheduledTime:
          flight.scheduledTime,

        operationId:
          operation?.id || null,

        soulsOnBoard:
          operation?.soulsOnBoard ||
          null,

        actualTime:
          operation?.actualTime ||
          null,

        aircraftReg:
          operation?.aircraft
            ?.registrationNumber ||
          null,

        aircraftType:
          operation?.aircraft
            ?.type || null,

        bayName:
          operation?.bay?.name ||
          null,

        delayMinutes,

        delayStatus,
      };
    }
  );

  // -----------------------------------
  // INSERT SNAPSHOT
  // -----------------------------------

  await prisma.archivedDailyOperation.createMany(
    {
      data: archiveRows,
    }
  );
}