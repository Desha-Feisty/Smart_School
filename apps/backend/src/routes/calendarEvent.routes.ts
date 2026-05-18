import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as calendarEventController from "../controllers/calendarEvent.controller.js";

const router = Router();

// Create event for a course (teacher only)
router.post(
    "/:courseId/events",
    authMiddleware,
    requireRole("teacher"),
    calendarEventController.createCalendarEvent
);

// Get events for a course (authenticated users)
router.get(
    "/:courseId/events",
    authMiddleware,
    calendarEventController.listCourseCalendarEvents
);

// Update an event (teacher only - owner)
router.put(
    "/:courseId/events/:eventId",
    authMiddleware,
    requireRole("teacher"),
    calendarEventController.updateCalendarEvent
);

// Delete an event (teacher only - owner)
router.delete(
    "/:courseId/events/:eventId",
    authMiddleware,
    requireRole("teacher"),
    calendarEventController.deleteCalendarEvent
);

export default router;