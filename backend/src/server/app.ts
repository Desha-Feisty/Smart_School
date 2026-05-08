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
import searchRoutes from "../routes/search.routes.js";
import ticketRoutes from "../routes/ticket.routes.js";
import calendarEventRoutes from "../routes/calendarEvent.routes.js";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as quizController from "../controllers/quiz.controller.js";
import { specs } from "../utils/swagger.js";

// Request timeout middleware to detect hanging requests
const requestTimeout = (timeoutMs: number = 30000) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const timeoutId = setTimeout(() => {
            console.error(`[TIMEOUT] Request to ${req.method} ${req.path} timed out after ${timeoutMs}ms`);
        }, timeoutMs);
        
        // Override res.send to clear timeout
        const originalSend = res.send.bind(res);
        res.send = (body?: any) => {
            clearTimeout(timeoutId);
            return originalSend(body);
        };
        
        // Override res.json to clear timeout
        const originalJson = res.json.bind(res);
        res.json = (body: any) => {
            clearTimeout(timeoutId);
            return originalJson(body);
        };
        
        next();
    };
};
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
    max: isTest ? 10000 : 1000, // Increased from 500
    message: { error: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limit for autosave (frequent endpoint)
const autosaveLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isTest ? 1000 : 60, // Increased from 30
    message: { error: "Too many autosave requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// More lenient limiter for read operations (GET requests)
const readLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: isTest ? 10000 : 500, // Increased from 200
    message: { error: "Too many read requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
// CORS configuration - allow all origins for development
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
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

app.use(requestTimeout(30000));
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/courses", calendarEventRoutes);
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
app.use("/api/search", searchRoutes);
app.use("/api/tickets", ticketRoutes);
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
