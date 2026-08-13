import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";
import { FocmFlightOperationUpsertedEvent } from "../types/replication/focmReplication.types";
import { FOCM_REPLICATION_JOB } from "./focmReplication.jobs";

export const focmReplicationQueue =
  new Queue<FocmFlightOperationUpsertedEvent>(
    "focm-to-ific",
    {
      connection: redisConnection,

      defaultJobOptions: {
        attempts: 5,

        backoff: {
          type: "exponential",
          delay: 5000,
        },

        removeOnComplete: {
          age: 24 * 60 * 60,
          count: 1000,
        },

        removeOnFail: false,
      },
    }
  );

export {
  FOCM_REPLICATION_JOB,
};


// export async function testFocmReplicationQueue() {
//   const job = await focmReplicationQueue.add(
//     "test-connection",
//     {
//       message: "FOCM → IFIC BullMQ connection test",
//     }
//   );

//   console.log(
//     `BullMQ test job created: ${job.id}`
//   );
// }