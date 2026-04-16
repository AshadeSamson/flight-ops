import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { 
    loginHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
    getMeHandler,
 } from "../controllers/auth/auth.controller";
 import { authLimiter } from "../middleware/rateLimiter";
import requireAuth from "../middleware/requireAuth";


const router = Router();

router.use(authLimiter);


router.post("/login", asyncHandler(loginHandler));
router.post("/forgot-password", asyncHandler(forgotPasswordHandler));
router.post("/password-reset", asyncHandler(resetPasswordHandler));
router.get("/me", requireAuth, asyncHandler(getMeHandler));



export default router;