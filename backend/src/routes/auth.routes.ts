import { authMiddleware } from "../middleware/auth.js";
import { register, login, logout, me } from "../controllers/auth.controller.js";
import { Router } from "express";
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);

export default router;
