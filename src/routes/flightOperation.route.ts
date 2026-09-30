import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import requireAuth from "../middleware/requireAuth";
import requireRole from "../middleware/requireRole";
import {  
  createFlightOperationHandler,
  getFlightFromScheduleHandler,
  upsertFlightOperationHandler,
  getDailyOperationsHandler,
  getFlightOperationsHistoryHandler
} from "../controllers/flightOperations/flightOperation.controller";


const router = Router();


router.get( "/daily", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF", "OPS_PERSONNEL"), asyncHandler(getDailyOperationsHandler));
router.patch( "/upsert", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF", "OPS_PERSONNEL"), asyncHandler(upsertFlightOperationHandler));
router.get( "/schedule", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF", "OPS_PERSONNEL"), asyncHandler(getFlightFromScheduleHandler));
router.post( "/", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF", "OPS_PERSONNEL"), asyncHandler(createFlightOperationHandler));
router.get("/history", requireAuth, requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF", "OPS_PERSONNEL"), asyncHandler(getFlightOperationsHistoryHandler));


export default router;