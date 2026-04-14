import { z } from "zod";

// 🕒 Time format (HH:mm:ss)
const timeStringSchema = z.string().regex(
  /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,
  "Time must be in HH:mm:ss format"
);

// 📅 Date schema (ISO string expected from frontend)
const dateSchema = z.string().datetime();

export const createFlightOperationSchema = z.object({
  flightNumber: z.string().min(2).trim(),

  movementType: z.enum(["ARRIVAL", "DEPARTURE"]),

  // Optional relations
  airlineId: z.string().cuid().optional(),
  aircraftId: z.string().cuid().optional(),
  airportId: z.string().cuid().optional(),
  bayId: z.string().cuid().optional(),

  sob: z.number().int().positive().optional(),

  scheduledTime: timeStringSchema,

  actualTime: z.string().datetime().optional(),

  date: dateSchema,
});



export const updateFlightOperationSchema = z.object({
  flightNumber: z.string().min(2).trim().optional(),

  movementType: z.enum(["ARRIVAL", "DEPARTURE"]).optional(),

  airlineId: z.string().cuid().optional(),
  aircraftId: z.string().cuid().optional(),
  airportId: z.string().cuid().optional(),
  bayId: z.string().cuid().optional(),

  sob: z.number().int().positive().optional(),

  scheduledTime: timeStringSchema.optional(),

  actualTime: z.string().datetime().optional(),

  date: dateSchema.optional(),
});