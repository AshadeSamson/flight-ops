import {
  focmMasterDataQueue,
} from "../../queues/focmMasterData.queue";

import {
  AircraftReplicationEvent,
} from "../../types/replication/masterDataReplication.types";

export default async function enqueueAircraftReplication(
  event: AircraftReplicationEvent
) {
  const job = await focmMasterDataQueue.add(
    "aircraft-upserted",
    event,
    {
      jobId: event.eventId,

      attempts: 10,

      backoff: {
        type: "exponential",
        delay: 5000,
      },

      removeOnComplete: 100,

      removeOnFail: false,
    }
  );

  console.log(
    `FOCM → IFIC aircraft replication queued: ${job.id}`
  );

  return job;
}