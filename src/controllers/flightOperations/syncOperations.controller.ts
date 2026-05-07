import { Request, Response } from "express";

import syncDailyFlightSchedule from "../../services/fidsServices/syncDailyFlightSchedule";
import refreshDailyFlightSchedule from "../../services/fidsServices/refreshDailyFlightSchedule";



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




export const refresh = async (
  req: Request,
  res: Response
) => {
  await refreshDailyFlightSchedule();

  res.json({
    message:
      "Daily operations refreshed successfully",
  });
};