import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import requireAuth from "../middleware/requireAuth";

import {
  getAircraftsHandler,
  getBaysHandler,
  getAirportsHandler,
  getAirlinesHandler,
} from "../controllers/reference/reference.controller";

const router = Router();


router.get("/aircrafts", requireAuth, asyncHandler(getAircraftsHandler));
router.get("/bays", requireAuth, asyncHandler(getBaysHandler));
router.get("/airports", requireAuth, asyncHandler(getAirportsHandler));
router.get("/airlines", requireAuth, asyncHandler(getAirlinesHandler));

export default router;