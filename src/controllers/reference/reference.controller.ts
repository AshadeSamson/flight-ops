import { Request, Response } from "express";
import getAircrafts from "../../services/referenceServices/getAircrafts";
import getBays from "../../services/referenceServices/getBays";
import getAirports from "../../services/referenceServices/getAirports";
import getAirlines from "../../services/referenceServices/getAirlines";
import createAirline from "../../services/referenceServices/createAirline";
import updateAirline from "../../services/referenceServices/updateAirline";
import deleteAirline from "../../services/referenceServices/deleteAirline";

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

export async function createAirlineHandler(
  req: Request,
  res: Response
) {
  const data = await createAirline(req.body);

  return res.status(201).json({
    message: "Airline created successfully",
    data,
  });
}

export async function updateAirlineHandler(
  req: Request,
  res: Response
) {
  const data = await updateAirline(
    String(req.params.id),
    req.body
  );

  return res.status(200).json({
    message: "Airline updated successfully",
    data,
  });
}

export async function deleteAirlineHandler(
  req: Request,
  res: Response
) {
  await deleteAirline(String(req.params.id));

  return res.status(200).json({
    message: "Airline deleted successfully",
  });
}