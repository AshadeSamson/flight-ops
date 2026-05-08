import { Request, Response } from "express";

import syncDailyFlightSchedule from "../../services/fidsServices/syncDailyFlightSchedule";
import refreshDailyFlightSchedule from "../../services/fidsServices/refreshDailyFlightSchedule";

import createAuditLog from "../../services/auditServices/createAuditLog";

export const sync = async (
  req: Request,
  res: Response
) => {
  await syncDailyFlightSchedule();

  // Non-blocking audit log
  createAuditLog({
    userId: (req as any).user?.id,

    action: "ARCHIVE_DAILY_FLIGHTS_OPERATIONS",

    module: "FIDS",

    description:
      "Triggered archival of daily flight operations",

    metadata: {
      type: "ARCHIVE",
    },

    ipAddress: req.ip,

    userAgent:
      req.headers["user-agent"],
  }).catch((error) => {
    console.error(
      "Audit log failed:",
      error
    );
  });

  res.json({
    message:
      "Operations archived successfully",
  });
};

export const refresh = async (
  req: Request,
  res: Response
) => {
  await refreshDailyFlightSchedule();

  // Non-blocking audit log
  createAuditLog({
    userId: (req as any).user?.id,

    action: "REFRESH_DAILY_FLIGHTS",

    module: "FIDS",

    description:
      "Refreshed & synced daily flight schedule",

    metadata: {
      type: "REFRESH",
    },

    ipAddress: req.ip,

    userAgent:
      req.headers["user-agent"],
  }).catch((error) => {
    console.error(
      "Audit log failed:",
      error
    );
  });

  res.json({
    message:
      "Daily operations synced successfully",
  });
};