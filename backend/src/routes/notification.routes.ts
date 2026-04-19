import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";

const router = Router();

router.get("/", authMiddleware, getNotifications);
router.patch("/:id/read", authMiddleware, markAsRead);
router.post("/read-all", authMiddleware, markAllAsRead);

export default router;
