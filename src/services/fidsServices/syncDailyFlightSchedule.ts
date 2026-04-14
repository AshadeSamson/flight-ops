import { prisma } from "../../config/prisma";
import getNormalizedFidsData from "./getNormalizedFidsData";

export default async function syncDailyFlightSchedule() {
  try {
    const flights = await getNormalizedFidsData();

    if (!flights.length) {
      console.log("No FIDS data to sync");
      return;
    }

    // Get today's date (start of day)
    // ✅ Lagos-safe "today"
      const now = new Date();

      const lagosNow = new Date(
        now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
      );

      const startOfDay = new Date(
        lagosNow.getFullYear(),
        lagosNow.getMonth(),
        lagosNow.getDate()
      );

      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
    

    // 🔴 Step 1: Delete existing records for today
    await prisma.dailyFlightSchedule.deleteMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // 🟢 Step 2: Insert fresh data
    await prisma.dailyFlightSchedule.createMany({
      data: flights.map((flight) => ({
        flightNumber: flight.flightNumber,
        airlineCode: flight.airlineCode,
        airlineName: undefined,

        movementType: flight.movementType,

        airportCode: flight.airportCode,
        airportName: flight.airportName,

        scheduledTime: flight.scheduledTime,
        status: flight.status,

        date: flight.date,
      })),
      skipDuplicates: true, // safety
    });

    console.log(`✅ Synced ${flights.length} flights`);
  } catch (error) {
    console.error("❌ Failed to sync DailyFlightSchedule:", error);
    throw error;
  }
}