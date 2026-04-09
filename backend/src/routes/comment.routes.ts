import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import * as commentController from "../controllers/comment.controller.js";

const router = Router();

// Add comment on note (enrolled members)
router.post("/:noteId/comments", authMiddleware, commentController.addComment);

// Delete comment (author or course teacher)
router.delete("/:commentId", authMiddleware, commentController.deleteComment);

// Update comment (author only)
router.put("/:commentId", authMiddleware, commentController.updateComment);

export default router;
