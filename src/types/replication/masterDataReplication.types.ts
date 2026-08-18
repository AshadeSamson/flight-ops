export interface AirlineReplicationPayload {
  airlineId: string;
  code: string;
  name: string;
  updatedAt: string;
}

export interface AircraftReplicationPayload {
  aircraftId: string;
  registrationNumber: string;
  type: string;
  maxCapacity: number;

  airline: {
    code: string;
    name: string;
  };

  updatedAt: string;
}

export interface AirportReplicationPayload {
  airportId: string;
  code: string;
  name: string;
  updatedAt: string;
}

export interface AirlineReplicationEvent {
  eventId: string;
  event: "FOCM.AIRLINE_UPSERTED";
  version: 1;
  occurredAt: string;
  data: AirlineReplicationPayload;
}

// export interface AircraftReplicationEvent {
//   eventId: string;
//   event: "FOCM.AIRCRAFT_UPSERTED";
//   version: 1;
//   occurredAt: string;
//   data: AircraftReplicationPayload;
// }

// export interface AirportReplicationEvent {
//   eventId: string;
//   event: "FOCM.AIRPORT_UPSERTED";
//   version: 1;
//   occurredAt: string;
//   data: AirportReplicationPayload;
// }

export interface AircraftReplicationEvent {
  eventId: string;

  event: "FOCM.AIRCRAFT_UPSERTED";

  version: 1;

  occurredAt: string;

  data: {
    aircraftId: string;

    registrationNumber: string;

    type: string;

    maxCapacity: number;

    airline: {
      code: string;
      name: string;
    };

    updatedAt: string;
  };
}

export interface AirportReplicationEvent {
  eventId: string;

  event: "FOCM.AIRPORT_UPSERTED";

  version: 1;

  occurredAt: string;

  data: {
    airportId: string;

    code: string;

    name: string;

    updatedAt: string;
  };
}