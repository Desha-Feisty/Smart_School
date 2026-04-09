import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as attemptController from "../controllers/attempt.controller.js";
const router = Router();

router.post(
    "/:quizId/attempts/start",
    authMiddleware,
    requireRole("student"),
    attemptController.startAttempt,
);
router.post(
    "/start",
    authMiddleware,
    requireRole("student"),
    attemptController.startAttemptFromBody,
);
router.patch(
    "/:attemptId/answers",
    authMiddleware,
    requireRole("student"),
    attemptController.autoSaveAnswer,
);
router.put(
    "/:attemptId/answer",
    authMiddleware,
    requireRole("student"),
    attemptController.autoSaveAnswer,
);
router.post(
    "/:attemptId/submit",
    authMiddleware,
    requireRole("student"),
    attemptController.submitAttempt,
);
router.put(
    "/:attemptId/submit",
    authMiddleware,
    requireRole("student"),
    attemptController.submitAttempt,
);
router.get(
    "/my",
    authMiddleware,
    requireRole("student"),
    attemptController.listMyGrades,
);
router.get(
    "/my-grades",
    authMiddleware,
    requireRole("student"),
    attemptController.listMyGrades,
);
router.get("/:attemptId/result", authMiddleware, attemptController.getResult);
router.get(
    "/:attemptId/grade",
    authMiddleware,
    requireRole("student"),
    attemptController.getResult,
);
router.get(
    "/:attemptId",
    authMiddleware,
    requireRole("student"),
    attemptController.getAttemptDetails,
);
router.get(
    "/student/:studentId/course/:courseId",
    authMiddleware,
    requireRole("teacher"),
    attemptController.getStudentCourseGrades,
);

export default router;
