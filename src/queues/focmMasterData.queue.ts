import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const focmMasterDataQueue =
  new Queue("focm-master-data", {
    connection: redisConnection,
  });