import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as noteController from "../controllers/note.controller.js";

const router = Router();

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
    noteController.listCourseNotes,
);

// Get note with comments (enrolled members)
router.get("/:noteId", authMiddleware, noteController.getNoteWithComments);

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
