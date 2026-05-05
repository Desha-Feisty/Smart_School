import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as noteController from "../controllers/note.controller.js";

const router = Router();

// More lenient limiter for read operations
const readLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute for reads
    message: { error: "Too many read requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Create note (teacher only)
router.post(
    "/courses/:courseId/notes",
    authMiddleware,
    requireRole("teacher"),
    noteController.createNote,
);

// List course notes (enrolled students/teachers)
router.get(
    "/courses/:courseId/notes",
    authMiddleware,
    readLimiter,
    noteController.listCourseNotes,
);

// Get note with comments (enrolled members)
router.get("/:noteId", authMiddleware, readLimiter, noteController.getNoteWithComments);

// Update note (author teacher only)
router.put(
    "/:noteId",
    authMiddleware,
    requireRole("teacher"),
    noteController.updateNote,
);

// Delete note (author teacher only)
router.delete(
    "/:noteId",
    authMiddleware,
    requireRole("teacher"),
    noteController.deleteNote,
);

export default router;
