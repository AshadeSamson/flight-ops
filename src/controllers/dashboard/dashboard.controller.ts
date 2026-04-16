import { Request, Response } from "express";
import getTodaySummary from "../../services/dashboardServices/getTodaySummary";

export async function getTodaySummaryHandler(
  req: Request,
  res: Response
) {
  const data = await getTodaySummary();

  return res.status(200).json({
    message: "Dashboard summary retrieved successfully",
    data,
  });
}