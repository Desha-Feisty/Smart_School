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
router.get("/:id", authMiddleware, quizController.getQuizDetails);
router.put(
    "/:id",
    authMiddleware,
    requireRole("teacher"),
    quizController.updateQuiz,
);
router.delete(
    "/:id",
    authMiddleware,
    requireRole("teacher"),
    quizController.deleteQuiz,
);
router.post(
    "/:id/questions",
    authMiddleware,
    requireRole("teacher"),
    quizController.addQuestion,
);
router.post(
    "/:id/publish",
    authMiddleware,
    requireRole("teacher"),
    quizController.publishQuiz,
);
router.post(
    "/:id/questions/generate-ai",
    authMiddleware,
    requireRole("teacher"),
    quizController.generateQuestionsWithAI,
);
router.get(
    "/:id/grades",
    authMiddleware,
    requireRole("teacher"),
    attemptController.listQuizGrades,
);

export default router;
