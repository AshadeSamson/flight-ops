import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import requireAuth from "../middleware/requireAuth";
import requireRole from "../middleware/requireRole";

import {
  createFlightOperationHandler,
} from "../controllers/flightOperations/flightOperation.controller";

const router = Router();


router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "SUPERVISOR", "OPS_STAFF"),
  asyncHandler(createFlightOperationHandler)
);

export default router;