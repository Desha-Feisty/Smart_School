import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";
import { sendError } from "../utils/response.js";

const isTest = process.env.NODE_ENV === "test";

// General API rate limit
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isTest ? 1000 : 500, // Increased from 100
    message: {
        success: false,
        error: "Too Many Requests",
        message: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
        return sendError(res, "Too many requests, please try again later", 429);
    },
});

// Strict rate limit for auth endpoints (login, register)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isTest ? 100 : 20, // Increased from 10
    message: {
        success: false,
        error: "Too Many Attempts",
        message: "Too many login attempts, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
        return sendError(
            res,
            "Too many authentication attempts. Please try again in 15 minutes.",
            429,
        );
    },
});

// Rate limit for quiz submissions
export const quizSubmissionLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Increased from 5
    message: {
        success: false,
        error: "Too Many Submissions",
        message: "Please wait before submitting again.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
        return sendError(res, "Too many quiz submissions, please wait", 429);
    },
});

// Stricter rate limit for create operations
export const createLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // Increased from 20
    message: {
        success: false,
        error: "Too Many Requests",
        message: "Too many creation requests, please slow down.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
        return sendError(res, "Too many requests to create resources", 429);
    },
});

// Rate limit for chat messages
export const chatLimiter = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    max: 30, // Increased from 10
    message: {
        success: false,
        error: "Too Many Messages",
        message: "Please wait before sending more messages.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
        return sendError(res, "Too many chat messages, please wait", 429);
    },
});