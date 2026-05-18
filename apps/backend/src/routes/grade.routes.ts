import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import { getStudentGrades } from "../controllers/grade.controller.js";

const router = Router();

// Get student grades for teacher
router.get("/student/:studentId", authMiddleware, requireRole("teacher"), getStudentGrades);

export default router;