type RawFidsFlight = {
  airlineCode?: string;
  flightNumber?: string;
  airport?: string;
  scheduledTime?: string;
  status?: string;
  movementType?: "ARRIVAL" | "DEPARTURE";
};

type NormalizedFlight = {
  flightNumber: string;
  airlineCode: string;

  airportName: string;
  airportCode?: string;

  scheduledTime: string;
  status?: string;

  movementType: "ARRIVAL" | "DEPARTURE";

  date: Date;
};

export default function normalizeFidsData(
  departures: RawFidsFlight[] = [],
  arrivals: RawFidsFlight[] = []
): NormalizedFlight[] {
  const allFlights = [...departures, ...arrivals];

  // Lagos operational day
  const now = new Date();

  const lagosToday = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Africa/Lagos",
    })
  );

  const startOfDay = new Date(
    lagosToday.getFullYear(),
    lagosToday.getMonth(),
    lagosToday.getDate()
  );

  return allFlights
    .map((flight) => {
      const airlineCode = String(
        flight.airlineCode || ""
      ).trim();

      const flightNumber = String(
        flight.flightNumber || ""
      ).trim();

      const airportName = String(
        flight.airport || ""
      ).trim();

      const scheduledTime = String(
        flight.scheduledTime || ""
      ).trim();

      const movementType =
        flight.movementType === "ARRIVAL"
          ? "ARRIVAL"
          : "DEPARTURE";

      // Skip bad rows with no flight number
      if (!flightNumber) {
        return null;
      }

      return {
        flightNumber: `${airlineCode} ${flightNumber}`,
        airlineCode,

        airportName,
        airportCode: undefined,

        scheduledTime,

        status: flight.status
          ? String(flight.status).trim()
          : undefined,

        movementType,

        date: startOfDay,
      };
    })
    .filter(Boolean) as NormalizedFlight[];
}