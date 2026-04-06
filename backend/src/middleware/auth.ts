import Jwt, { type JwtPayload } from "jsonwebtoken";
import User from "../models/user.js";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";

const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : null;
        if (!token) return res.status(401).json({ errMsg: "unauthenticated" });
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing from environment variables!");
            return res.status(500).json({ errMsg: "could not verify user" });
        }
        const payload = Jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
        if (!payload || typeof payload === "string" || !payload._id) {
            return res.status(500).json({ errMsg: "could not verify user" });
        }
        const user = await User.findById(payload._id);
        if (!user) {
            return res.status(401).json({ errMsg: "user not found" });
        }
        req.user = { id: user._id.toString(), role: user.role };
        next();
    } catch (error) {
        console.error(
            "JWT verification error:",
            error instanceof Error ? error.message : error,
        );
        res.status(401).json({ errMsg: "could not verify user" });
    }
};

function requireRole(role: string) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user?.role !== role) {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        next();
    };
}
export { authMiddleware, requireRole };
