import { Request, Response } from "express";
import createFlightOperation from "../../services/flightOperationServices/createFlightOperation";
import getDailyOperations from "../../services/flightOperationServices/getDailyOperations";
import upsertFlightOperation from "../../services/flightOperationServices/upsertFlightOperation";
import getFlightFromSchedule from "../../services/flightOperationServices/getFlightFromSchedule";


// 🔹 Secondary (manual / admin use)
export async function createFlightOperationHandler(
  req: Request,
  res: Response
) {
  await createFlightOperation(req, res);
}


// 🔥 CORE: Daily sheet endpoint
export async function getDailyOperationsHandler(
  req: Request,
  res: Response
) {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      message: "date is required",
    });
  }

  const data = await getDailyOperations(date as string);

  return res.status(200).json({
    message: "Daily operations retrieved successfully",
    data,
  });
}


// 🔥 CORE: Upsert (table editing)
export async function upsertFlightOperationHandler(
  req: Request,
  res: Response
) {
  await upsertFlightOperation(req, res);
}


// 🔹 Optional helper
export async function getFlightFromScheduleHandler(
  req: Request,
  res: Response
) {
  const { flightNumber, movementType, date } = req.query;

  if (!flightNumber || !movementType || !date) {
    return res.status(400).json({
      message: "flightNumber, movementType and date are required",
    });
  }

  const flight = await getFlightFromSchedule(
    flightNumber as string,
    movementType as "ARRIVAL" | "DEPARTURE",
    date as string
  );

  if (!flight) {
    return res.status(404).json({
      message: "Flight not found in schedule",
    });
  }

  return res.status(200).json({
    message: "Flight retrieved successfully",
    data: flight,
  });
}