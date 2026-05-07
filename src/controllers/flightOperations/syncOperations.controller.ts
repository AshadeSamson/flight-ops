import { Request, Response } from "express";

import syncDailyFlightSchedule from "../../services/fidsServices/syncDailyFlightSchedule";

export const sync = async (
  req: Request,
  res: Response
) => {
  await syncDailyFlightSchedule();

  res.json({
    message:
      "Operations synced successfully",
  });
};