import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { updateFlightOperationSchema } from "../../controllers/flightOperations/flightOperation.schema";
import {
  buildScheduledDateTime,
  calculateDelayMinutes,
  getDelayStatus,
} from "../../utils/flightMetrics";
import { getLagosDateRange } from "../../utils/lagosDate";
import createAuditLog from "../auditServices/createAuditLog";
import {
  enqueueFlightOperationReplication,
} from "../../queues/producers/focmReplication.producer";
import {
  FocmFlightOperationUpsertedEvent,
} from "../../types/replication/focmReplication.types";



export default async function upsertFlightOperation(
  req: Request,
  res: Response
) {
  try {
    const result = updateFlightOperationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid input data",
        errors: result.error.flatten(),
      });
    }

    const {
      flightNumber,
      movementType,
      aircraftReg,
      bayName,
      airlineCode,
      airportCode,
      airportName,
      soulsOnBoard,
      scheduledTime,
      actualTime,
      boardingTime,
      delayStatus,
      remarks,
      date,
    } = result.data;

    const isCancelled = delayStatus === "CANCELLED";

    if (!flightNumber || !movementType || !date) {
      return res.status(400).json({
        message: "flightNumber, movementType and date are required",
      });
    }

    // ✅ Normalize Lagos day
    const { startOfDay, endOfDay } = getLagosDateRange(date);

    const schedule = await prisma.dailyFlightSchedule.findFirst({
      where: {
        flightNumber,
        movementType,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    

    // ✅ Map Aircraft
    let aircraftId: string | undefined;
    let aircraftAirlineId: string | undefined;

    if (aircraftReg && !isCancelled) {
      const aircraft = await prisma.aircraft.findFirst({
        where: {
          registrationNumber: aircraftReg,
        },
      });

      if (!aircraft) {
        return res.status(404).json({
          message: "Aircraft not found",
        });
      }

      aircraftId = aircraft.id;
      aircraftAirlineId = aircraft.airlineId;
    }

    // ✅ Map Bay
    let bayId: string | undefined;

    if (bayName && !isCancelled) {
      const bay = await prisma.bay.findFirst({
        where: {
          name: bayName,
        },
      });

      if (!bay) {
        return res.status(404).json({
          message: "Bay not found",
        });
      }

      bayId = bay.id;
    }

    // ✅ Map Airline
    let airlineId: string | undefined;

    const flightNumberParts = flightNumber
      .trim()
      .split(/\s+/);

    const flightAirlineCode =
      flightNumberParts.length > 1
        ? flightNumberParts[0]?.toUpperCase()
        : undefined;

    const resolvedAirlineCode =
      airlineCode?.trim().toUpperCase() ||
      schedule?.airlineCode?.trim().toUpperCase() ||
      flightAirlineCode;

    if (resolvedAirlineCode && !isCancelled) {
      const airline = await prisma.airline.findUnique({
        where: {
          code: resolvedAirlineCode,
        },
      });

      if (!airline) {
        return res.status(404).json({
          message: "Airline not found",
        });
      }

      airlineId = airline.id;
    } else if (aircraftAirlineId) {
      airlineId = aircraftAirlineId;
    }

    // ✅ Map Airport
    let airportId: string | undefined;

    const resolvedAirportCode =
      airportCode?.trim().toUpperCase() ||
      schedule?.airportCode?.trim().toUpperCase();

    const resolvedAirportName =
      airportName?.trim() ||
      schedule?.airportName?.trim();

    if (resolvedAirportCode && !isCancelled) {
      const airport = await prisma.airport.findUnique({
        where: {
          code: resolvedAirportCode,
        },
      });

      if (!airport) {
        return res.status(404).json({
          message: "Airport not found",
        });
      }

      airportId = airport.id;
    } else if (resolvedAirportName && !isCancelled) {
      const airport = await prisma.airport.findFirst({
        where: {
          name: {
            equals: resolvedAirportName,
            mode: "insensitive",
          },
        },
      });

      if (!airport) {
        return res.status(404).json({
          message: "Airport not found",
        });
      }

      airportId = airport.id;
    }

    // ✅ Get user
    const user = (req as any).user;
    

    // ✅ Delay / status handling
    let calculatedDelayMinutes: number | null = null;
    let calculatedDelayStatus: string | null = null;

    // 🔴 Manual cancellation
    if (delayStatus === "CANCELLED") {
      calculatedDelayMinutes = null;
      calculatedDelayStatus = "CANCELLED";
    }

    // 🟢 Normal delay calculation
    else if (scheduledTime) {
      const scheduledDateTime =
        buildScheduledDateTime(
          startOfDay,
          scheduledTime
        );

      calculatedDelayMinutes =
        calculateDelayMinutes(
          scheduledDateTime,
          actualTime
            ? new Date(actualTime)
            : undefined
        );

      calculatedDelayStatus =
        getDelayStatus(
          calculatedDelayMinutes
        );
    }

    const resolvedScheduledTime =
      scheduledTime ||
      schedule?.scheduledTime;

    if (!resolvedScheduledTime) {
      return res.status(400).json({
        message: "scheduledTime is required",
      });
    }

    // ✅ TRUE UPSERT
    const operation =
      await prisma.flightOperation.upsert({
        where: {
          flightNumber_date_movementType: {
            flightNumber,
            date: startOfDay,
            movementType,
          },
        },

        update: {
          ...(aircraftId && { aircraftId }),
          ...(airlineId && { airlineId }),
          ...(airportId && { airportId }),
          ...(bayId && { bayId }),

          ...(isCancelled ? {
            soulsOnBoard: null,
          } :
            soulsOnBoard !== undefined && {
            soulsOnBoard,
          }),

          ...(scheduledTime && {
            scheduledTime,
          }),

          ...(remarks && {
            remarks,
          }),

          ...(delayStatus === "CANCELLED"
            ? {
                actualTime: null,
              }
            : actualTime
            ? {
                actualTime: new Date(
                  actualTime
                ),
              }
            : {}),

          ...(boardingTime && {
            boardingCall: new Date(
              boardingTime
            ),
          }),

          delayMinutes:
            calculatedDelayMinutes,

          delayStatus:
            calculatedDelayStatus,
        },

        create: {
          flightNumber,
          movementType,
          date: startOfDay,

          aircraftId,
          airlineId,
          airportId,
          bayId,

          soulsOnBoard: isCancelled ? null : soulsOnBoard,

          scheduledTime:
            resolvedScheduledTime,

          actualTime:
            delayStatus === "CANCELLED"
              ? null
              : actualTime
              ? new Date(actualTime)
              : undefined,

          boardingCall: boardingTime
            ? new Date(boardingTime)
            : null,

          delayMinutes:
            calculatedDelayMinutes,

          delayStatus:
            calculatedDelayStatus,
          
          remarks: remarks || null,

          createdById: user?.id,
        },

        include: {
          aircraft: true,
          airline: true,
          airport: true,
        },
      });


    // ✅ Enqueue FOCM replication job
    const replicationEvent:
        FocmFlightOperationUpsertedEvent = {
        event: "FOCM.FLIGHT_OPERATION_UPSERTED",

        version: 1,

        occurredAt: new Date().toISOString(),

        data: {
          operationId: operation.id,

          flightNumber: operation.flightNumber,

          movementType: operation.movementType,

          date: operation.date.toISOString(),

          airline: operation.airline
            ? {
                code: operation.airline.code,
                name: operation.airline.name,
              }
            : null,

          aircraft: operation.aircraft
            ? {
                registrationNumber:
                  operation.aircraft.registrationNumber,

                type: operation.aircraft.type,

                maxCapacity:
                  operation.aircraft.maxCapacity,
              }
            : null,

          airport: operation.airport
            ? {
                code: operation.airport.code,
                name: operation.airport.name,
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

        // ✅ Non-blocking Audit Log
    createAuditLog({
        userId: user?.id,

        action:
          delayStatus === "CANCELLED"
            ? "CANCEL_OPERATION"
            : "UPSERT_OPERATION",

        module: "FLIGHT_OPERATIONS",

        description:
          delayStatus === "CANCELLED"
            ? `Cancelled flight ${flightNumber}`
            : `Updated flight ${flightNumber}`,

        entityType: "FlightOperation",

        entityId: operation.id,

        metadata: {
          flightNumber,
          movementType,

          airlineCode:
            resolvedAirlineCode,

          airportCode:
            resolvedAirportCode,

          soulsOnBoard,

          delayStatus:
            calculatedDelayStatus,

          delayMinutes:
            calculatedDelayMinutes,

          remarks: remarks || null,
        },

        ipAddress: req.ip,

        userAgent:
          req.headers["user-agent"],
      }).catch((error) => {
        console.error(
          "Audit log failed:",
          error
        );
      });

    // console.log(
    //   "FOCM replication event:",
    //   JSON.stringify(
    //     replicationEvent,
    //     null,
    //     2
    //   )
    // );

    res.status(200).json({
      message:
        "Flight operation upserted successfully",
      data: operation,
    });

    // ✅ Enqueue replication job
    enqueueFlightOperationReplication(
      replicationEvent
    ).catch((error) => {
      console.error(
        "FOCM → IFIC replication enqueue failed:",
        error
      );
    });
    
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}
