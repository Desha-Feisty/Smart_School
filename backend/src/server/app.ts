import express, {
    type Request,
    type Response,
    type NextFunction,
} from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import authRoutes from "../routes/auth.routes.js";
import courseRoutes from "../routes/course.routes.js";
import quizRoutes from "../routes/quiz.routes.js";
import attemptRoutes from "../routes/attempt.routes.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as quizController from "../controllers/quiz.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve simple UI for testing endpoints
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/docs", express.static(path.join(__dirname, "..", "docs")));

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/attempts", attemptRoutes);

// Question management root-level endpoints
app.post(
    "/api/questions",
    authMiddleware,
    requireRole("teacher"),
    quizController.addQuestionViaBody,
);
app.put(
    "/api/questions/:id",
    authMiddleware,
    requireRole("teacher"),
    quizController.updateQuestion,
);
app.delete(
    "/api/questions/:id",
    authMiddleware,
    requireRole("teacher"),
    quizController.deleteQuestion,
);

// Basic error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
    });
});

export default app;
