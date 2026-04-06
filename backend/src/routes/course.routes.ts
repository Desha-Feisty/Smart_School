import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import {
    getCourse,
    createCourse,
    joinCourseByCode,
    updateCourse,
    deleteCourse,
    getRoster,
    listAllCourses,
    listMyCourses,
} from "../controllers/course.controller.js";

const router = Router();
router.post("/", authMiddleware, requireRole("teacher"), createCourse);
router.get("/", authMiddleware, listMyCourses);
router.get("/my", authMiddleware, listMyCourses);
router.get("/my-courses", authMiddleware, listMyCourses);
router.get("/:id", authMiddleware, getCourse);
router.patch("/:id", authMiddleware, requireRole("teacher"), updateCourse);
router.delete("/:id", authMiddleware, requireRole("teacher"), deleteCourse);
router.post("/join", authMiddleware, requireRole("student"), joinCourseByCode);
router.get("/:id/roster", authMiddleware, requireRole("teacher"), getRoster);
router.get("/all", authMiddleware, listAllCourses);
export default router;
