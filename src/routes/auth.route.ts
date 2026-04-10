import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { 
    loginHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
 } from "../controllers/auth/auth.controller";
 import { authLimiter } from "../middleware/rateLimiter";


const router = Router();

router.use(authLimiter);


router.post("/login", asyncHandler(loginHandler));
router.post("/forgot-password", asyncHandler(forgotPasswordHandler));
router.post("/password-reset", asyncHandler(resetPasswordHandler));



export default router;