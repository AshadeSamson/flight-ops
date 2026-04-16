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


router.get( "/daily", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(getDailyOperationsHandler));
router.patch( "/upsert", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(upsertFlightOperationHandler));
router.get( "/schedule", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(getFlightFromScheduleHandler));
router.post( "/", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"), asyncHandler(createFlightOperationHandler));

export default router;