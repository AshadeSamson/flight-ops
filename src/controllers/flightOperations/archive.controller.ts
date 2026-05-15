import { Request, Response } from "express";
import getArchivedOperations from "../../services/flightOperationServices/getArchivedOperations";
import updateArchivedOperation from "../../services/flightOperationServices/updateArchivedOperation";
import { updateArchiveOperationSchema } from "./archive.schema";


export const list = async (
  req: Request,
  res: Response
) => {
  const page =
    Number(req.query.page) || 1;

  const limit =
    Number(req.query.limit) || 20;

  const result =
    await getArchivedOperations(
      page,
      limit,
      {
        movementType:
          req.query
            .movementType as
            | "ARRIVAL"
            | "DEPARTURE",

        airlineCode:
          req.query
            .airlineCode as string,

        search:
          req.query.search as string,

        status:
          req.query.status as
            | "ON_TIME"
            | "MINOR_DELAY"
            | "DELAYED"
            | "PENDING"
            | "CANCELLED",

        startDate:
          req.query
            .startDate as string,

        endDate:
          req.query
            .endDate as string,
      }
    );

  res.json(result);
};


export const update = async (
  req: Request,
  res: Response
) => {
  const parsed =
    updateArchiveOperationSchema.parse(
      req.body
    );

  const archiveId = Array.isArray(
    req.params.id
  )
    ? req.params.id[0]
    : req.params.id;

  if (!archiveId) {
    throw new Error(
      "Missing archive id"
    );
  }

  const userId = (req as any).user.id;

  const result =
    await updateArchivedOperation(
      archiveId,
      parsed,
      userId
    );

  res.json(result);
};