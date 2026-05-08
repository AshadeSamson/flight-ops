import { Request, Response } from "express";
import getAuditLogs from "../../services/auditServices/getAuditLogs";

export async function getAuditLogsHandler(
  req: Request,
  res: Response
) {
  const data = await getAuditLogs({
    page: Number(req.query.page || 1),

    limit: Number(
      req.query.limit || 20
    ),

    module:
      req.query.module as string,

    action:
      req.query.action as string,

    userId:
      req.query.userId as string,

    startDate:
      req.query.startDate as string,

    endDate:
      req.query.endDate as string,

    search:
      req.query.search as string,
  });

  return res.status(200).json({
    message:
      "Audit logs retrieved successfully",

    ...data,
  });
}