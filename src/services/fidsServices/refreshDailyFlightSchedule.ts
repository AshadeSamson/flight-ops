import { prisma } from "../../config/prisma";

import getNormalizedFidsData from "./getNormalizedFidsData";
import { getLagosDayAnchor } from "../../utils/lagosDate";

export default async function refreshDailyFlightSchedule() {
  try {
    const flights =
      await getNormalizedFidsData();

    if (!flights.length) {
      console.log(
        "No FIDS data to sync"
      );

      return;
    }

    const startOfDay = getLagosDayAnchor();

    // -----------------------------------
    // CLEAR ONLY DAILY TABLE
    // -----------------------------------

    await prisma.dailyFlightSchedule.deleteMany(
      {}
    );

    // -----------------------------------
    // INSERT NEW FIDS DATA
    // -----------------------------------

    await prisma.dailyFlightSchedule.createMany(
      {
        data: flights.map(
          (flight) => ({
            flightNumber:
              flight.flightNumber.trim(),

            airlineCode:
              flight.airlineCode.trim(),

            airlineName: undefined,

            movementType:
              flight.movementType,

            airportCode:
              flight.airportCode,

            airportName:
              flight.airportName,

            scheduledTime:
              flight.scheduledTime,

            status:
              flight.status,

            date: startOfDay,
          })
        ),

        skipDuplicates: true,
      }
    );

    console.log(
      ` Refreshed ${flights.length} flights`
    );
  } catch (error) {
    console.error(
      " Failed to refresh DailyFlightSchedule:",
      error
    );

    throw error;
  }
}
