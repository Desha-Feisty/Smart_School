import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getCourseLeaderboard } from "../controllers/leaderboard.controller.js";

const router = Router();

router.get("/course/:courseId", authMiddleware, getCourseLeaderboard);

export default router;
