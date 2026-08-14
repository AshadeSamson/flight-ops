export type FocmMovementType =
  | "ARRIVAL"
  | "DEPARTURE";

export interface FocmFlightOperationReplicationPayload {
  operationId: string;

  flightNumber: string;

  movementType: FocmMovementType;

  date: string;

  airline: {
    code: string;
    name: string;
  } | null;

  aircraft: {
    registrationNumber: string;
    type: string;
    maxCapacity: number;
  } | null;

  airport: {
    code: string;
    name: string;
  } | null;

  soulsOnBoard: number | null;

  scheduledTime: string;

  actualTime: string | null;

  boardingCall: string | null;

  delayMinutes: number | null;

  delayStatus: string | null;

  remarks: string | null;

  createdAt: string;

  updatedAt: string;
}


export interface FocmFlightOperationUpsertedEvent {
  eventId: string;

  event: "FOCM.FLIGHT_OPERATION_UPSERTED";

  version: 1;

  occurredAt: string;

  data: FocmFlightOperationReplicationPayload;
}