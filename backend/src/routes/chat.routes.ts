import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getRecentChats } from "../controllers/chat.controller.js";

const router = Router();

router.get("/recent", authMiddleware, getRecentChats);

export default router;
