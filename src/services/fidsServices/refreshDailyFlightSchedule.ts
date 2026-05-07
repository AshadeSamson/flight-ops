import { prisma } from "../../config/prisma";

import getNormalizedFidsData from "./getNormalizedFidsData";

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

    // -----------------------------------
    // LAGOS OPERATIONAL DAY
    // -----------------------------------

    const now = new Date();

    const lagosNow = new Date(
      now.toLocaleString("en-US", {
        timeZone: "Africa/Lagos",
      })
    );

    const startOfDay = new Date(
      Date.UTC(
        lagosNow.getFullYear(),
        lagosNow.getMonth(),
        lagosNow.getDate(),
        -1,
        0,
        0
      )
    );

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