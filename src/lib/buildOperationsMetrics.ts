type FlightRow = {
  movementType: "ARRIVAL" | "DEPARTURE";

  airlineCode?: string | null;

  delayStatus?: string | null;

  actualTime?: Date | null;
};

export default function buildOperationsMetrics(
  rows: FlightRow[]
) {
  const totalScheduled = rows.length;

  const completed = rows.filter(
    (row) => row.actualTime
  ).length;

  const delayed = rows.filter(
    (row) =>
      row.delayStatus === "DELAYED"
  ).length;

  const arrivals = rows.filter(
    (row) =>
      row.movementType === "ARRIVAL"
  ).length;

  const departures = rows.filter(
    (row) =>
      row.movementType ===
      "DEPARTURE"
  ).length;

  // -----------------------------------
  // STATUS BREAKDOWN
  // -----------------------------------

  const statusBreakdown = {
    onTime: rows.filter(
      (row) =>
        row.delayStatus === "ON_TIME"
    ).length,

    minorDelay: rows.filter(
      (row) =>
        row.delayStatus ===
        "MINOR_DELAY"
    ).length,

    delayed: rows.filter(
      (row) =>
        row.delayStatus === "DELAYED"
    ).length,

    cancelled: rows.filter(
      (row) =>
        row.delayStatus ===
        "CANCELLED"
    ).length,
  };

  // -----------------------------------
  // AIRLINE BREAKDOWN
  // -----------------------------------

  const airlineMap = new Map<
    string,
    {
      airlineCode: string;

      totalFlights: number;

      arrivals: number;

      departures: number;
    }
  >();

  for (const row of rows) {
    const code =
      row.airlineCode || "UNKNOWN";

    if (!airlineMap.has(code)) {
      airlineMap.set(code, {
        airlineCode: code,

        totalFlights: 0,

        arrivals: 0,

        departures: 0,
      });
    }

    const airline =
      airlineMap.get(code)!;

    airline.totalFlights += 1;

    if (
      row.movementType === "ARRIVAL"
    ) {
      airline.arrivals += 1;
    }

    if (
      row.movementType ===
      "DEPARTURE"
    ) {
      airline.departures += 1;
    }
  }

  return {
    totalScheduled,

    completed,

    pending:
      totalScheduled - completed,

    delayed,

    arrivals,

    departures,

    statusBreakdown,

    airlineBreakdown: Array.from(
      airlineMap.values()
    ),
  };
}