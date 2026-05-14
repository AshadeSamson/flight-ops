type FlightRow = {
  flightNumber?: string;

  movementType: "ARRIVAL" | "DEPARTURE";

  airportName?: string | null;

  scheduledTime?: string | null;

  actualTime?: Date | null;

  aircraftReg?: string | null;

  bayName?: string | null;

  airlineCode?: string | null;

  airlineName?: string | null;

  delayStatus?: string | null;

  soulsOnBoard?: number | null;
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
  // TOTAL SOB
  // -----------------------------------

  const totalSoulsOnBoard =
    rows.reduce(
      (sum, row) =>
        sum + (row.soulsOnBoard || 0),
      0
    );

  const arrivalSoulsOnBoard =
    rows
      .filter(
        (row) =>
          row.movementType ===
          "ARRIVAL"
      )
      .reduce(
        (sum, row) =>
          sum +
          (row.soulsOnBoard || 0),
        0
      );

  const departureSoulsOnBoard =
    rows
      .filter(
        (row) =>
          row.movementType ===
          "DEPARTURE"
      )
      .reduce(
        (sum, row) =>
          sum +
          (row.soulsOnBoard || 0),
        0
      );

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

    pending: rows.filter(
      (row) =>
        row.delayStatus === "PENDING"
    ).length,
  };

  // -----------------------------------
  // AIRLINE BREAKDOWN
  // -----------------------------------

  const airlineMap = new Map<
    string,
    {
      airlineCode: string;

      airlineName: string | null;

      totalFlights: number;

      arrivals: number;

      departures: number;

      totalSoulsOnBoard: number;

      arrivalSoulsOnBoard: number;

      departureSoulsOnBoard: number;

      cancelledFlights: number;

      flights: {
        arrivals: {
          flightNumber?: string;

          airport?: string | null;

          scheduled?: string | null;

          actual?: Date | null;

          aircraftReg?: string | null;

          bay?: string | null;

          soulsOnBoard?: number | null;

          delayStatus?: string | null;
        }[];

        departures: {
          flightNumber?: string;

          airport?: string | null;

          scheduled?: string | null;

          actual?: Date | null;

          aircraftReg?: string | null;

          bay?: string | null;

          soulsOnBoard?: number | null;

          delayStatus?: string | null;
        }[];
      };
    }
  >();

  for (const row of rows) {
    const code =
      row.airlineCode || "UNKNOWN";

    if (!airlineMap.has(code)) {
      airlineMap.set(code, {
        airlineCode: code,

        airlineName:
          row.airlineName || null,

        totalFlights: 0,

        arrivals: 0,

        departures: 0,

        totalSoulsOnBoard: 0,

        arrivalSoulsOnBoard: 0,

        departureSoulsOnBoard: 0,

        cancelledFlights: 0,

        flights: {
          arrivals: [],

          departures: [],
        },
      });
    }

    const airline =
      airlineMap.get(code)!;

    airline.totalFlights += 1;

    airline.totalSoulsOnBoard +=
      row.soulsOnBoard || 0;

    if (
      row.delayStatus ===
      "CANCELLED"
    ) {
      airline.cancelledFlights += 1;
    }

    const flightDetails = {
      flightNumber:
        row.flightNumber,

      airport:
        row.airportName,

      scheduled:
        row.scheduledTime,

      actual:
        row.actualTime,

      aircraftReg:
        row.aircraftReg,

      bay:
        row.bayName,

      soulsOnBoard:
        row.soulsOnBoard,

      delayStatus:
        row.delayStatus,
    };

    if (
      row.movementType === "ARRIVAL"
    ) {
      airline.arrivals += 1;

      airline.arrivalSoulsOnBoard +=
        row.soulsOnBoard || 0;

      airline.flights.arrivals.push(
        flightDetails
      );
    }

    if (
      row.movementType ===
      "DEPARTURE"
    ) {
      airline.departures += 1;

      airline.departureSoulsOnBoard +=
        row.soulsOnBoard || 0;

      airline.flights.departures.push(
        flightDetails
      );
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

    totalSoulsOnBoard,

    soulsOnBoard: {
      arrivals:
        arrivalSoulsOnBoard,

      departures:
        departureSoulsOnBoard,
    },

    statusBreakdown,

    airlineBreakdown: Array.from(
      airlineMap.values()
    ),
  };
}