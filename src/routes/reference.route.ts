import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import requireAuth from "../middleware/requireAuth";

import {
  getAircraftsHandler,
  getBaysHandler,
  getAirportsHandler,
  getAirlinesHandler,
  createAirlineHandler,
  updateAirlineHandler,
  deleteAirlineHandler,
} from "../controllers/reference/reference.controller";
import requireRole from "../middleware/requireRole";


const router = Router();


router.get("/aircrafts", requireAuth, asyncHandler(getAircraftsHandler));
router.get("/bays", requireAuth, asyncHandler(getBaysHandler));
router.get("/airports", requireAuth, asyncHandler(getAirportsHandler));
router.get("/airlines", requireAuth, asyncHandler(getAirlinesHandler));


router.post("/airlines", requireAuth, requireRole("ADMIN"), asyncHandler(createAirlineHandler));
router.patch("/airlines/:id", requireAuth, requireRole("ADMIN"), asyncHandler(updateAirlineHandler));
router.delete("/airlines/:id", requireAuth, requireRole("ADMIN"), asyncHandler(deleteAirlineHandler));

export default router;