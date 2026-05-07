import { Router } from "express";
import { authMiddleware, requireRole } from "../middleware/auth.js";
import * as ticketController from "../controllers/ticket.controller.js";

const router = Router();

// User routes - create and list their own tickets
router.post("/", authMiddleware, ticketController.createTicket);
router.get("/", authMiddleware, ticketController.listMyTickets);

// Admin routes - list all tickets and respond
router.get(
    "/all",
    authMiddleware,
    requireRole("admin"),
    ticketController.listAllTickets
);
router.patch(
    "/:id/respond",
    authMiddleware,
    requireRole("admin"),
    ticketController.respondToTicket
);

export default router;