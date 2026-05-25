import { prisma } from "../../config/prisma";

import {
  buildScheduledDateTime,
  calculateDelayMinutes,
  getDelayStatus,
} from "../../utils/flightMetrics";
import { getLagosDayAnchor } from "../../utils/lagosDate";

type Payload = {
  aircraftReg?: string;
  bayName?: string;
  soulsOnBoard?: number;
  actualTime?: string;
  delayStatus?: string;
};

export default async function updateArchivedOperation(
  archiveId: string,
  payload: Payload,
  userId: string
) {
  const archive =
    await prisma.archivedDailyOperation.findUnique(
      {
        where: {
          id: archiveId,
        },
      }
    );

  if (!archive) {
    throw new Error(
      "Archived operation not found"
    );
  }

  // -----------------------------
  // MAP AIRCRAFT
  // -----------------------------

  let aircraftId:
    | string
    | undefined;

  if (payload.aircraftReg) {
    const aircraft =
      await prisma.aircraft.findFirst({
        where: {
          registrationNumber:
            payload.aircraftReg,
        },
      });

    if (!aircraft) {
      throw new Error(
        "Aircraft not found"
      );
    }

    aircraftId = aircraft.id;
  }

  // -----------------------------
  // MAP BAY
  // -----------------------------

  let bayId: string | undefined;

  if (payload.bayName) {
    const bay =
      await prisma.bay.findFirst({
        where: {
          name: payload.bayName,
        },
      });

    if (!bay) {
      throw new Error("Bay not found");
    }

    bayId = bay.id;
  }

  // -----------------------------
  // MAP AIRLINE
  // -----------------------------

  let airlineId:
    | string
    | undefined;

  if (archive.airlineCode) {
    const airline =
      await prisma.airline.findUnique({
        where: {
          code: archive.airlineCode,
        },
      });

    airlineId = airline?.id;
  }

  // -----------------------------
  // MAP AIRPORT
  // -----------------------------

  let airportId:
    | string
    | undefined;

  if (archive.airportName) {
    const airport =
      await prisma.airport.findFirst({
        where: {
          name: {
            equals:
              archive.airportName,

            mode: "insensitive",
          },
        },
      });

    airportId = airport?.id;
  }

  const startOfDay = getLagosDayAnchor(
    archive.snapshotDate
  );

  // -----------------------------
  // DELAY CALCULATION
  // -----------------------------

  let calculatedDelayMinutes:
    | number
    | null = null;

  let calculatedDelayStatus:
    | string
    | null = null;

  if (
    payload.delayStatus ===
    "CANCELLED"
  ) {
    calculatedDelayMinutes = null;

    calculatedDelayStatus =
      "CANCELLED";
  } else {
    const scheduledDateTime =
      buildScheduledDateTime(
        startOfDay,
        archive.scheduledTime
      );

    calculatedDelayMinutes =
      calculateDelayMinutes(
        scheduledDateTime,
        payload.actualTime
          ? new Date(
              payload.actualTime
            )
          : undefined
      );

    calculatedDelayStatus =
      getDelayStatus(
        calculatedDelayMinutes
      );
  }

  // -----------------------------
  // UPSERT OPERATION
  // -----------------------------

  const operation =
    await prisma.flightOperation.upsert({
      where: {
        flightNumber_date_movementType:
          {
            flightNumber:
              archive.flightNumber,

            date: startOfDay,

            movementType:
              archive.movementType,
          },
      },

      update: {
        ...(aircraftId && {
          aircraftId,
        }),

        ...(bayId && { bayId }),

        ...(airlineId && {
          airlineId,
        }),

        ...(airportId && {
          airportId,
        }),

        ...(payload.soulsOnBoard !==
          undefined && {
          soulsOnBoard:
            payload.soulsOnBoard,
        }),

        ...(payload.actualTime
          ? {
              actualTime:
                new Date(
                  payload.actualTime
                ),
            }
          : {}),

        delayMinutes:
          calculatedDelayMinutes,

        delayStatus:
          calculatedDelayStatus,
      },

      create: {
        flightNumber:
          archive.flightNumber,

        movementType:
          archive.movementType,

        date: startOfDay,

        scheduledTime:
          archive.scheduledTime,

        aircraftId,

        bayId,

        airlineId,

        airportId,

        soulsOnBoard:
          payload.soulsOnBoard,

        actualTime:
          payload.actualTime
            ? new Date(
                payload.actualTime
              )
            : undefined,

        delayMinutes:
          calculatedDelayMinutes,

        delayStatus:
          calculatedDelayStatus,

        createdById: userId,
      },
    });

  // -----------------------------
  // UPDATE ARCHIVE SNAPSHOT
  // -----------------------------

  await prisma.archivedDailyOperation.update(
    {
      where: {
        id: archiveId,
      },

      data: {
        ...(payload.aircraftReg && {
          aircraftReg:
            payload.aircraftReg,
        }),

        ...(payload.bayName && {
          bayName: payload.bayName,
        }),

        ...(payload.soulsOnBoard !==
          undefined && {
          soulsOnBoard:
            payload.soulsOnBoard,
        }),

        ...(payload.actualTime && {
          actualTime: new Date(
            payload.actualTime
          ),
        }),

        delayMinutes:
          calculatedDelayMinutes,

        delayStatus:
          calculatedDelayStatus,
      },
    }
  );

  return operation;
}
