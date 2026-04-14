import { Request, Response } from "express";
import createFlightOperation from "../../services/flightOperationServices/createFlightOperation";

export async function createFlightOperationHandler(
  req: Request,
  res: Response
) {
  await createFlightOperation(req, res);
}