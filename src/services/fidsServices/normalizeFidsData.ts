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
  status?: string | null | undefined;
  movementType: "ARRIVAL" | "DEPARTURE";
  date: string;
};

export default function normalizeFidsData(
  departures: RawFidsFlight[],
  arrivals: RawFidsFlight[]
): NormalizedFlight[] {
  const allFlights = [...departures, ...arrivals];

  const today = new Date();

  return allFlights.map((flight) => ({
  flightNumber: flight.flightNumber.trim(),
  airlineCode: flight.airlineCode.trim(),

  airportName: flight.airport.trim(), // ✅ correct
  airportCode: undefined, // placeholder

  scheduledTime: flight.scheduledTime,
  status: flight.status || null,
  movementType: flight.movementType,

  date: new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).toLocaleString('en-GB', {
    timeZone: 'Africa/Lagos',
  })
}));
}