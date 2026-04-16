import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { createFlightOperationSchema } from "../../controllers/flightOperations/flightOperation.schema";

export default async function createFlightOperation(
  req: Request,
  res: Response
) {
  try {
    const result = createFlightOperationSchema.safeParse(req.body);

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

    // 🔄 Map Aircraft (reg → id)
    let aircraftId: string | undefined;

    if (aircraftReg) {
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
    }

    // 🔄 Map Bay (name → id)
    let bayId: string | undefined;

    if (bayName) {
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

    // 👤 Get user
    const user = (req as any).user;

    // 🟢 Create record
    const operation = await prisma.flightOperation.create({
      data: {
        flightNumber,
        movementType,

        aircraftId,
        bayId,

        sob: soulsOnBoard,

        scheduledTime,
        actualTime: actualTime ? new Date(actualTime) : undefined,

        date: startOfDay,

        createdById: user?.id,
      },
    });

    return res.status(201).json({
      message: "Flight operation created successfully",
      data: operation,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}