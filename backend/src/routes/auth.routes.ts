import { authMiddleware } from "../middleware/auth.js";
import { register, login, logout, me, changePassword } from "../controllers/auth.controller.js";
import { Router } from "express";
import { authLimiter } from "../middleware/rateLimit.js";
import refreshRouter from "./refresh.routes.js";

const router = Router();

// Apply rate limiting to auth endpoints
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, me);
router.put("/password", authMiddleware, changePassword);

// Refresh token endpoint
router.use("/refresh", refreshRouter);

export default router;