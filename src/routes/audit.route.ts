import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import requireAuth from "../middleware/requireAuth";
import requireRole from "../middleware/requireRole";
import {
  getAuditLogsHandler,
} from "../controllers/audit/audit.controller";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN", "SUPERVISOR"), asyncHandler(getAuditLogsHandler));

export default router;