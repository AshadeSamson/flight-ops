import { Router } from "express";
import * as controller from "../controllers/flightOperations/archive.controller";

import asyncHandler from "../middleware/asyncHandler";
import requireRole from "../middleware/requireRole";
import requireAuth from "../middleware/requireAuth";

const router = Router();

router.get("/", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(controller.list));
router.put("/:id", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(controller.update));

export default router;