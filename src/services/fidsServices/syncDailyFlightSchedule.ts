import { prisma } from "../../config/prisma";
import getNormalizedFidsData from "./getNormalizedFidsData";
import createArchiveSnapshot from "../flightOperationServices/createArchiveSnapshot";
import { getLagosDayAnchor } from "../../utils/lagosDate";

export default async function syncDailyFlightSchedule() {
  try {
    const flights = await getNormalizedFidsData();

    if (!flights.length) {
      console.log("No FIDS data to sync");
      return;
    }

    const startOfDay = getLagosDayAnchor();

    const existingFlights =
      await prisma.dailyFlightSchedule.count();

    if (existingFlights > 0) {
      await createArchiveSnapshot();
    }

    //  Clear ALL previous cache rows
    await prisma.dailyFlightSchedule.deleteMany({});

    //  Insert fresh rows for today only
    await prisma.dailyFlightSchedule.createMany({
      data: flights.map((flight) => ({
        //  FIDS already provides full flight number
        flightNumber: flight.flightNumber.trim(),

        airlineCode: flight.airlineCode.trim(),
        airlineName: undefined,

        movementType: flight.movementType,

        airportCode: flight.airportCode,
        airportName: flight.airportName,

        scheduledTime: flight.scheduledTime,
        status: flight.status,

        date: startOfDay,
      })),
      skipDuplicates: true,
    });

    console.log(
      ` Synced ${flights.length} flights for ${startOfDay.toISOString()}`
    );
  } catch (error) {
    console.error(
      " Failed to sync DailyFlightSchedule:",
      error
    );
    throw error;
  }
}
