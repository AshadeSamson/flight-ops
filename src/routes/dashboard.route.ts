import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import requireAuth from "../middleware/requireAuth";
import requireRole from "../middleware/requireRole";
import { getTodaySummaryHandler } from "../controllers/dashboard/dashboard.controller";

const router = Router();

router.get("/today-summary", requireAuth, requireRole("ADMIN", "SUPERVISOR"), asyncHandler(getTodaySummaryHandler));

export default router;