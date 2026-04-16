import { prisma } from "../../config/prisma";

export default async function getFlightFromSchedule(
  flightNumber: string,
  movementType: "ARRIVAL" | "DEPARTURE",
  date: string
) {
  
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