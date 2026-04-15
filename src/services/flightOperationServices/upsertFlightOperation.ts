import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { updateFlightOperationSchema } from "../../controllers/flightOperations/flightOperation.schema";

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
      aircraftType,
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

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // 🔍 Check if operation already exists
    const existingOperation = await prisma.flightOperation.findFirst({
      where: {
        flightNumber,
        movementType,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

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

    const user = (req as any).user;

    // 🟢 CASE 1: UPDATE
    if (existingOperation) {
      const updated = await prisma.flightOperation.update({
        where: { id: existingOperation.id },
        data: {
          ...(aircraftId && { aircraftId }),
          ...(bayId && { bayId }),
          ...(soulsOnBoard !== undefined && { sob: soulsOnBoard }),
          ...(scheduledTime && { scheduledTime }),
          ...(actualTime && { actualTime: new Date(actualTime) }),
        },
      });

      return res.status(200).json({
        message: "Flight operation updated",
        data: updated,
      });
    }

    // 🟢 CASE 2: CREATE
    const created = await prisma.flightOperation.create({
      data: {
        flightNumber,
        movementType,

        aircraftId,
        bayId,

        sob: soulsOnBoard,

        scheduledTime: scheduledTime!,
        actualTime: actualTime ? new Date(actualTime) : undefined,

        date: startOfDay,
        createdById: user?.id,
      },
    });

    return res.status(201).json({
      message: "Flight operation created",
      data: created,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}