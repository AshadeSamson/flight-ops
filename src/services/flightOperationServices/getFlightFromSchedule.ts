import { prisma } from "../../config/prisma";
import { getLagosDateRange } from "../../utils/lagosDate";

export default async function getFlightFromSchedule(
  flightNumber: string,
  movementType: "ARRIVAL" | "DEPARTURE",
  date: string
) {
  
  const { startOfDay, endOfDay } = getLagosDateRange(date);

  const flight = await prisma.dailyFlightSchedule.findFirst({
    where: {
      flightNumber,
      movementType,
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  if (!flight) {
    return null;
  }

  return {
    flightNumber: flight.flightNumber,
    airlineCode: flight.airlineCode,
    airportName: flight.airportName,
    scheduledTime: flight.scheduledTime,
    status: flight.status,
  };
}
