import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { updateFlightOperationSchema } from "../../controllers/flightOperations/flightOperation.schema";
import {
  buildScheduledDateTime,
  calculateDelayMinutes,
  getDelayStatus,
} from "../../utils/flightMetrics";

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
      soulsOnBoard,
      scheduledTime,
      actualTime,
      date,
    } = result.data;

    if (!flightNumber || !movementType || !date) {
      return res.status(400).json({
        message: "flightNumber, movementType and date are required",
      });
    }

    // 🧠 Normalize Lagos day
    const inputDate = new Date(date);

    const lagosDate = new Date(
      inputDate.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    );

    const startOfDay = new Date(
      lagosDate.getFullYear(),
      lagosDate.getMonth(),
      lagosDate.getDate()
    );

    // 🔄 Map Aircraft
    let aircraftId: string | undefined;

    if (aircraftReg) {
      const aircraft = await prisma.aircraft.findFirst({
        where: { registrationNumber: aircraftReg },
      });

      if (!aircraft) {
        return res.status(404).json({
          message: "Aircraft not found",
        });
      }

      aircraftId = aircraft.id;
    }

    // 🔄 Map Bay
    let bayId: string | undefined;

    if (bayName) {
      const bay = await prisma.bay.findFirst({
        where: { name: bayName },
      });

      if (!bay) {
        return res.status(404).json({
          message: "Bay not found",
        });
      }

      bayId = bay.id;
    }

    // 👤 Get user
    const user = (req as any).user;

    // 🧠 Build scheduled datetime (only if scheduledTime exists)
    let delayMinutes: number | null = null;
    let delayStatus: string | null = null;

    if (scheduledTime) {
      const scheduledDateTime = buildScheduledDateTime(
        startOfDay,
        scheduledTime
      );

      delayMinutes = calculateDelayMinutes(
        scheduledDateTime,
        actualTime ? new Date(actualTime) : undefined
      );

      delayStatus = getDelayStatus(delayMinutes);
    }

    // 🔥 TRUE UPSERT (atomic)
    const operation = await prisma.flightOperation.upsert({
      where: {
        flightNumber_date_movementType: {
          flightNumber,
          date: startOfDay,
          movementType,
        },
      },
      update: {
        ...(aircraftId && { aircraftId }),
        ...(bayId && { bayId }),
        ...(soulsOnBoard !== undefined && { soulsOnBoard }),
        ...(scheduledTime && { scheduledTime }),
        ...(actualTime && { actualTime: new Date(actualTime) }),

        delayMinutes,
        delayStatus,
      },
      create: {
        flightNumber,
        movementType,
        date: startOfDay,

        aircraftId,
        bayId,
        soulsOnBoard,

        scheduledTime: scheduledTime!,
        actualTime: actualTime ? new Date(actualTime) : undefined,

        delayMinutes,
        delayStatus,

        createdById: user?.id,
      },
    });

    return res.status(200).json({
      message: "Flight operation upserted successfully",
      data: operation,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}