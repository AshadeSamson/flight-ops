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

  // ✅ UI-based inputs (NOT IDs)
  aircraftReg: z.string().optional(),
  aircraftType: z.string().optional(),
  bayName: z.string().optional(),

  // ✅ Ops data
  soulsOnBoard: z.number().int().positive().optional(),

  scheduledTime: timeStringSchema,

  actualTime: z.string().datetime().optional(),

  date: dateSchema,
});

export const updateFlightOperationSchema = z.object({
  flightNumber: z.string().min(2).trim().optional(),

  movementType: z.enum(["ARRIVAL", "DEPARTURE"]).optional(),

  aircraftReg: z.string().optional(),
  aircraftType: z.string().optional(),
  bayName: z.string().optional(),
  airlineCode: z.string().optional(),
  airportCode: z.string().optional(),
  airportName: z.string().optional(),

  soulsOnBoard: z.number().int().positive().optional(),

  scheduledTime: timeStringSchema.optional(),

  actualTime: z.string().datetime().optional(),

  date: dateSchema.optional(),
});
