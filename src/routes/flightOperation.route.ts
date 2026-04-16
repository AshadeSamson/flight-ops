import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import requireAuth from "../middleware/requireAuth";
import requireRole from "../middleware/requireRole";

import {  
  createFlightOperationHandler,
  getFlightFromScheduleHandler,
  upsertFlightOperationHandler,
  getDailyOperationsHandler
} from "../controllers/flightOperations/flightOperation.controller";

const router = Router();

// 🔥 CORE: Load daily operations (your table)
router.get( "/daily", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(getDailyOperationsHandler));

// 🔥 CORE: Edit table (create or update)
router.patch( "/upsert", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(upsertFlightOperationHandler));

// 🔹 OPTIONAL: Manual lookup
router.get( "/schedule", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(getFlightFromScheduleHandler));

// 🔹 SECONDARY: Manual create (kept as requested)
router.post( "/", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(createFlightOperationHandler));

export default router;