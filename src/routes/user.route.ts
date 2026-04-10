import { Router } from "express";
import requireAuth from "../middleware/requireAuth";
import requireRole from "../middleware/requireRole";
import asyncHandler from "../middleware/asyncHandler";
import { 
    getUserProfileHandler,
    createUserHandler,
    getAllUsersHandler,
    getAUserHandler,
    updateUserHandler,
} from "../controllers/users/user.controller";


const router = Router();

router.get("/profile", requireAuth, asyncHandler(getUserProfileHandler));
router.post("/", requireAuth, requireRole("ADMIN"), asyncHandler(createUserHandler));
router.get("/", requireAuth, requireRole("ADMIN"), asyncHandler(getAllUsersHandler));
router.get("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(getAUserHandler));
router.patch("/:id", requireAuth, requireRole("ADMIN"), asyncHandler(updateUserHandler));


export default router;