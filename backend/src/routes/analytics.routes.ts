import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getCourseAnalytics, getStudentProgress } from "../controllers/analytics.controller.js";

const router = Router();

router.get("/course/:courseId", authMiddleware, getCourseAnalytics);
router.get("/student/course/:courseId", authMiddleware, getStudentProgress);

export default router;
