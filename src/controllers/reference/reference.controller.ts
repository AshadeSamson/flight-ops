import { Request, Response } from "express";
import getAircrafts from "../../services/referenceServices/getAircrafts";
import getBays from "../../services/referenceServices/getBays";
import getAirports from "../../services/referenceServices/getAirports";
import getAirlines from "../../services/referenceServices/getAirlines";

export async function getAircraftsHandler(req: Request, res: Response) {
  const data = await getAircrafts();

  return res.status(200).json({
    message: "Aircrafts retrieved successfully",
    data,
  });
}

export async function getBaysHandler(req: Request, res: Response) {
  const data = await getBays();

  return res.status(200).json({
    message: "Bays retrieved successfully",
    data,
  });
}

export async function getAirportsHandler(req: Request, res: Response) {
  const data = await getAirports();

  return res.status(200).json({
    message: "Airports retrieved successfully",
    data,
  });
}

export async function getAirlinesHandler(req: Request, res: Response) {
  const data = await getAirlines();

  return res.status(200).json({
    message: "Airlines retrieved successfully",
    data,
  });
}