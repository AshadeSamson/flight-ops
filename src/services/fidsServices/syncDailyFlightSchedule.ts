import { prisma } from "../../config/prisma";
import getNormalizedFidsData from "./getNormalizedFidsData";

export default async function syncDailyFlightSchedule() {
  try {
    const flights = await getNormalizedFidsData();

    if (!flights.length) {
      console.log("No FIDS data to sync");
      return;
    }

    // ✅ Lagos operational day (stored as UTC equivalent)
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

    // 🔴 Clear ALL previous cache rows
    await prisma.dailyFlightSchedule.deleteMany({});

    // 🟢 Insert fresh rows for today only
    await prisma.dailyFlightSchedule.createMany({
      data: flights.map((flight) => ({
        // ✅ FIDS already provides full flight number
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
      `✅ Synced ${flights.length} flights for ${startOfDay.toISOString()}`
    );
  } catch (error) {
    console.error(
      "❌ Failed to sync DailyFlightSchedule:",
      error
    );
    throw error;
  }
}