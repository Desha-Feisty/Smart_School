import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as quizController from "../controllers/quiz.controller.js";
import * as attemptController from "../controllers/attempt.controller.js";
const router = Router();
router.post(
    "/:id/quizzes",
    authMiddleware,
    requireRole("teacher"),
    quizController.createQuiz,
);
router.post(
    "/",
    authMiddleware,
    requireRole("teacher"),
    quizController.createQuizFromBody,
);
router.get("/course/:id", authMiddleware, quizController.listCourseQuizzes);
router.get("/available", authMiddleware, quizController.listAvailableQuizzes);
router.get("/:quizId", authMiddleware, quizController.getQuizDetails);
router.put(
    "/:quizId",
    authMiddleware,
    requireRole("teacher"),
    quizController.updateQuiz,
);
router.delete(
    "/:quizId",
    authMiddleware,
    requireRole("teacher"),
    quizController.deleteQuiz,
);
router.post(
    "/:quizId/questions",
    authMiddleware,
    requireRole("teacher"),
    quizController.addQuestion,
);
router.post(
    "/:quizId/publish",
    authMiddleware,
    requireRole("teacher"),
    quizController.publishQuiz,
);
router.get(
    "/:quizId/grades",
    authMiddleware,
    requireRole("teacher"),
    attemptController.listQuizGrades,
);

export default router;
