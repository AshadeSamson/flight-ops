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
      airlineId,
      aircraftId,
      airportId,
      bayId,
      sob,
      scheduledTime,
      actualTime,
      date,
    } = result.data;

    // 🧠 Normalize Lagos day (same pattern we used before)
    const inputDate = new Date(date);

    const lagosDate = new Date(
      inputDate.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
    );

    const startOfDay = new Date(
      lagosDate.getFullYear(),
      lagosDate.getMonth(),
      lagosDate.getDate()
    );

    // 🔍 Optional: Validate referenced entities
    if (airlineId) {
      const airline = await prisma.airline.findUnique({
        where: { id: airlineId },
      });

      if (!airline) {
        return res.status(404).json({ message: "Airline not found" });
      }
    }

    if (aircraftId) {
      const aircraft = await prisma.aircraft.findUnique({
        where: { id: aircraftId },
      });

      if (!aircraft) {
        return res.status(404).json({ message: "Aircraft not found" });
      }
    }

    if (airportId) {
      const airport = await prisma.airport.findUnique({
        where: { id: airportId },
      });

      if (!airport) {
        return res.status(404).json({ message: "Airport not found" });
      }
    }

    if (bayId) {
      const bay = await prisma.bay.findUnique({
        where: { id: bayId },
      });

      if (!bay) {
        return res.status(404).json({ message: "Bay not found" });
      }
    }

    // 👤 Get user
    const user = (req as any).user;

    // 🟢 Create record
    const operation = await prisma.flightOperation.create({
      data: {
        flightNumber,
        movementType,

        airlineId,
        aircraftId,
        airportId,
        bayId,

        sob,

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