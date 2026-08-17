import {
  focmMasterDataQueue,
} from "../../queues/focmMasterData.queue";

import {
  AirportReplicationEvent,
} from "../../types/replication/masterDataReplication.types";

export default async function enqueueAirportReplication(
  event: AirportReplicationEvent
) {
  const job = await focmMasterDataQueue.add(
    "airport-upserted",
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
    `FOCM → IFIC airport replication queued: ${job.id}`
  );

  return job;
}