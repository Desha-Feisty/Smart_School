import { type Request } from "express";
import { type Role } from "../controllers/user.controller.js";
interface AuthUser {
    id: string;
    _id?: string;
    role: Role | string;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}
