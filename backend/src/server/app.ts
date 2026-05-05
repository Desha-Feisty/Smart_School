import express, {
    type Request,
    type Response,
    type NextFunction,
} from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import swaggerUi from "swagger-ui-express";
import authRoutes from "../routes/auth.routes.js";
import courseRoutes from "../routes/course.routes.js";
import quizRoutes from "../routes/quiz.routes.js";
import attemptRoutes from "../routes/attempt.routes.js";
import noteRoutes from "../routes/note.routes.js";
import commentRoutes from "../routes/comment.routes.js";
import chatRoutes from "../routes/chat.routes.js";
import analyticsRoutes from "../routes/analytics.routes.js";
import adminRoutes from "../routes/admin.routes.js";
import leaderboardRoutes from "../routes/leaderboard.routes.js";
import notificationRoutes from "../routes/notification.routes.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as quizController from "../controllers/quiz.controller.js";
import { specs } from "../utils/swagger.js";
import { requestLogger } from "../middleware/requestLogger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Security: Helmet headers
app.use(helmet());

const isTest = process.env.NODE_ENV === "test";

// Security: Rate limiting - increased for normal use
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isTest ? 10000 : 500, // Much higher for tests
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limit for autosave (frequent endpoint)
const autosaveLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isTest ? 1000 : 30, // Much higher for tests
    message: { error: "Too many autosave requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// More lenient limiter for read operations (GET requests)
const readLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isTest ? 10000 : 200, // Much higher for tests
    message: { error: "Too many read requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(requestLogger);

// Serve simple UI for testing endpoints
app.use(express.static(path.join(__dirname, "..", "public")));
app.use("/docs", express.static(path.join(__dirname, "..", "docs")));

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "LMS API Documentation",
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
    },
}));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/chats", chatRoutes);
// Backward-compatible mount: older clients may use /api/chat
app.use("/api/chat", chatRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

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
