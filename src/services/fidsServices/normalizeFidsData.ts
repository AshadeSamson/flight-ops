type RawFidsFlight = {
  airlineCode: string;
  flightNumber: string;
  airport: string;
  scheduledTime: string;
  status?: string;
  movementType: "ARRIVAL" | "DEPARTURE";
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
  departures: RawFidsFlight[],
  arrivals: RawFidsFlight[]
): NormalizedFlight[] {
  const allFlights = [...departures, ...arrivals];

  // ✅ Lagos "today" 
  const now = new Date();

  const lagosToday = new Date(
    now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })
  );

  const startOfDay = new Date(
    lagosToday.getFullYear(),
    lagosToday.getMonth(),
    lagosToday.getDate()
  );

  return allFlights.map((flight) => ({
    flightNumber: `${flight.airlineCode.trim()} ${flight.flightNumber.trim()}`,
    airlineCode: flight.airlineCode.trim(),

    airportName: flight.airport.trim(),
    airportCode: undefined,

    scheduledTime: flight.scheduledTime, 

    status: flight.status || undefined,
    movementType: flight.movementType,

    date: startOfDay, 
  }));
}