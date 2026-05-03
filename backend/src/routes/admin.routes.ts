import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as adminController from "../controllers/admin.controller.js";

const router = Router();

// All admin routes require authentication and the 'admin' role
router.use(authMiddleware);
router.use(requireRole("admin"));

// User Management
router.get("/users", adminController.listUsers);
router.post("/users", adminController.addUser);
router.delete("/users/:id", adminController.deleteUser);

// Platform Analytics & Stats
router.get("/stats", adminController.getPlatformStats);
router.get("/analytics", adminController.getPlatformAnalytics);

// System Monitoring & Logging
router.get("/system-health", adminController.getSystemHealth);
router.get("/logs", adminController.getLogs);
router.get("/logs/stats", adminController.getLogStats);
router.get("/logs/latest", adminController.getLatestLogTimestamp);
router.get("/logs/export", adminController.exportLogs);

export default router;
