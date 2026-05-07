import { z } from "zod";

export const updateArchiveOperationSchema =
  z.object({
    aircraftReg: z.string().optional(),

    bayName: z.string().optional(),

    soulsOnBoard: z.number().optional(),

    actualTime: z.string().optional(),

    delayStatus: z
      .enum([
        "ON_TIME",
        "MINOR_DELAY",
        "DELAYED",
        "CANCELLED",
        "PENDING",
      ])
      .optional(),
  });