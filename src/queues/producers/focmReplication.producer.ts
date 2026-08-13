import {
  FocmFlightOperationUpsertedEvent,
} from "../../types/replication/focmReplication.types";

import {
  focmReplicationQueue,
  FOCM_REPLICATION_JOB,
} from "../focmReplication.queue";

export async function enqueueFlightOperationReplication(
  event: FocmFlightOperationUpsertedEvent
) {
  const job = await focmReplicationQueue.add(
    FOCM_REPLICATION_JOB.FLIGHT_OPERATION_UPSERTED,
    event,
    {
      jobId: event.eventId,
    }
  );

  console.log(
    `FOCM → IFIC replication queued: ${job.id} (${event.data.operationId})`
  );

  return job;
}