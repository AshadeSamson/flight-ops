import { Request, Response } from "express";
import getAircrafts from "../../services/referenceServices/getAircrafts";
import getBays from "../../services/referenceServices/getBays";
import getAirports from "../../services/referenceServices/getAirports";
import getAirlines from "../../services/referenceServices/getAirlines";
import createAirline from "../../services/referenceServices/createAirline";
import updateAirline from "../../services/referenceServices/updateAirline";
import deleteAirline from "../../services/referenceServices/deleteAirline";
import createAircraft from "../../services/referenceServices/createAircraft";
import updateAircraft from "../../services/referenceServices/updateAircraft";
import deleteAircraft from "../../services/referenceServices/deleteAircraft";
import createBay from "../../services/referenceServices/createBay";
import updateBay from "../../services/referenceServices/updateBay";
import deleteBay from "../../services/referenceServices/deleteBay";


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


export async function createAircraftHandler(
  req: Request,
  res: Response
) {
  const data = await createAircraft(req.body);

  return res.status(201).json({
    message: "Aircraft created successfully",
    data,
  });
}

export async function updateAircraftHandler(
  req: Request,
  res: Response
) {
  const data = await updateAircraft(
    String(req.params.id),
    req.body
  );

  return res.status(200).json({
    message: "Aircraft updated successfully",
    data,
  });
}

export async function deleteAircraftHandler(
  req: Request,
  res: Response
) {
  await deleteAircraft(String(req.params.id));

  return res.status(200).json({
    message: "Aircraft deleted successfully",
  });
}


export async function createBayHandler(
  req: Request,
  res: Response
) {
  const data = await createBay(req.body);

  return res.status(201).json({
    message: "Bay created successfully",
    data,
  });
}

export async function updateBayHandler(
  req: Request,
  res: Response
) {
  const data = await updateBay(
    String(req.params.id),
    req.body
  );

  return res.status(200).json({
    message: "Bay updated successfully",
    data,
  });
}

export async function deleteBayHandler(
  req: Request,
  res: Response
) {
  await deleteBay(String(req.params.id));

  return res.status(200).json({
    message: "Bay deleted successfully",
  });
}