import { prisma } from "../../config/prisma";
import {
  buildScheduledDateTime,
  calculateDelayMinutes,
  getDelayStatus,
} from "../../utils/flightMetrics";
import { getLagosDayAnchor } from "../../utils/lagosDate";
import { FocmFlightOperationUpsertedEvent } from "../../types/replication/focmReplication.types";
import { enqueueFlightOperationReplication } from "../../queues/producers/focmReplication.producer";

type Payload = {
  aircraftReg?: string;
  bayName?: string;
  soulsOnBoard?: number;
  actualTime?: string;
  boardingTime?: string;
  delayStatus?: string;
  remarks?: string;
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

  const isCancelled = payload.delayStatus === "CANCELLED";

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

        ...(isCancelled ? {
          soulsOnBoard: null,
        } : 
          payload.soulsOnBoard !== undefined && {
            soulsOnBoard: payload.soulsOnBoard,
          }),

        ...(isCancelled
          ? { actualTime: null }
          : payload.actualTime
          ? { actualTime: new Date(payload.actualTime) }
          : {}),

        ...(payload.boardingTime
          ? {
              boardingCall: new Date(
                payload.boardingTime
              ),
            }
          : {}),

        delayMinutes:
          calculatedDelayMinutes,

        delayStatus:
          calculatedDelayStatus,

        ...(payload.remarks && {
          remarks: payload.remarks,
        }),
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
          isCancelled ? null : payload.soulsOnBoard,

        actualTime: isCancelled
          ? null
          : payload.actualTime
          ? new Date(payload.actualTime)
          : undefined,
        
        boardingCall: payload.boardingTime
          ? new Date(payload.boardingTime)
          : null,

        delayMinutes:
          calculatedDelayMinutes,

        delayStatus:
          calculatedDelayStatus,

        remarks: payload.remarks || null,

        createdById: userId,
      },

      include: {
          aircraft: true,
          airline: true,
          airport: true,
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

        ...(isCancelled ? {
          soulsOnBoard: null,
        } : 
          payload.soulsOnBoard !== undefined && {
            soulsOnBoard: payload.soulsOnBoard,
          }),

        ...(isCancelled
          ? { actualTime: null }
          : payload.actualTime
          ? { actualTime: new Date(payload.actualTime) }
          : {}),

        ...(payload.boardingTime && {
          boardingCall: new Date(
            payload.boardingTime
          ),
        }),

        delayMinutes:
          calculatedDelayMinutes,

        delayStatus:
          calculatedDelayStatus,

        ...(payload.remarks && {
          remarks: payload.remarks,
        }),
      },
    }
  );


  // -----------------------------
  // ENQUEUE REPLICATION EVENT
  // -----------------------------

    const replicationEvent:
      FocmFlightOperationUpsertedEvent = {
      eventId:
        `focm-${operation.id}-${operation.updatedAt.getTime()}`,

      event:
        "FOCM.FLIGHT_OPERATION_UPSERTED",

      version: 1,

      occurredAt:
        new Date().toISOString(),

      data: {
        operationId:
          operation.id,

        flightNumber:
          operation.flightNumber,

        movementType:
          operation.movementType,

        date:
          operation.date.toISOString(),

        airline: operation.airline
          ? {
              code:
                operation.airline.code,

              name:
                operation.airline.name,
            }
          : null,

        aircraft: operation.aircraft
          ? {
              registrationNumber:
                operation.aircraft
                  .registrationNumber,

              type:
                operation.aircraft.type,

              maxCapacity:
                operation.aircraft.maxCapacity,
            }
          : null,

        airport: operation.airport
          ? {
              code:
                operation.airport.code,

              name:
                operation.airport.name,
            }
          : null,

        soulsOnBoard:
          operation.soulsOnBoard,

        scheduledTime:
          operation.scheduledTime,

        actualTime:
          operation.actualTime
            ? operation.actualTime.toISOString()
            : null,

        boardingCall:
          operation.boardingCall
            ? operation.boardingCall.toISOString()
            : null,

        delayMinutes:
          operation.delayMinutes,

        delayStatus:
          operation.delayStatus,

        remarks:
          operation.remarks,

        createdAt:
          operation.createdAt.toISOString(),

        updatedAt:
          operation.updatedAt.toISOString(),
      },
    };

    enqueueFlightOperationReplication(
      replicationEvent
    ).catch((error) => {
      console.error(
        "FOCM → IFIC replication enqueue failed:",
        error
      );
    });

  return operation;
}
