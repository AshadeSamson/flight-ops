import { Router } from "express";

import * as controller from "../controllers/flightOperations/syncOperations.controller";

import asyncHandler from "../middleware/asyncHandler";
import requireRole from "../middleware/requireRole";
import requireAuth from "../middleware/requireAuth";

const router = Router();

router.post("/", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(controller.sync));

export default router;