import { Router } from "express";
import asyncHandler from "../middleware/asyncHandler";
import { 
    registerHandler,
    verifyEmailHandler,
    loginHandler,
    logoutHandler,
    refreshTokenHandler,
    forgotPasswordHandler,
    resetPasswordHandler,
 } from "../controllers/auth/auth.controller";
 import { authLimiter } from "../middleware/rateLimiter";


const router = Router();

router.use(authLimiter);

router.post("/register", asyncHandler(registerHandler));
router.get("/verify-email", asyncHandler(verifyEmailHandler));
router.post("/login", asyncHandler(loginHandler));
router.post("/logout", asyncHandler(logoutHandler));
router.post("/refresh", asyncHandler(refreshTokenHandler));
router.post("/forgot-password", asyncHandler(forgotPasswordHandler));
router.post("/password-reset", asyncHandler(resetPasswordHandler));



export default router;