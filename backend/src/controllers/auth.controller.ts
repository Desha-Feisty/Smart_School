import type { Request, Response } from "express";
import User from "../models/user.js";
import joi from "joi";
import type { Role } from "./user.controller.js";
import { logActivity } from "../services/logger.js";
export interface RegisterBody {
    name: string;
    email: string;
    password: string;
    role: Role;
}
export interface loginBody {
    email: string;
    password: string;
}

const registerSchema = joi.object({
    name: joi.string().min(6).max(40).required(),
    password: joi.string().min(6).max(20).required(),
    email: joi.string().email().required(),
    role: joi.string().valid("student", "teacher").required(),
});

const register = async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    try {
        const { value, error } = registerSchema.validate(req.body, {
            stripUnknown: true,
        });
        if (error) {
            console.log("Register validation error:", error.message);
            return res
                .status(400)
                .json({ errMsg: "invalid input", details: error.details });
        }
        const { name, email, password, role } = value as RegisterBody;
        console.log("Register attempt for email:", email, "role:", role);
        const exists = await User.findOne({ email });
        if (exists) {
            console.log("Email already exists:", email);
            return res.status(400).json({ errMsg: "email is already used" });
        }
        const user = await User.create({ email, name, password, role });
        console.log("User created, generating token for:", email);
        
        await logActivity({
            userId: user._id.toString(),
            action: "user_created",
            details: `New ${role} account created: ${name} (${email})`,
            ipAddress: req.ip || undefined,
            userAgent: req.get("User-Agent") || undefined,
        });
        
        const token = await user.createToken();
        console.log("Token generated successfully");
        return res.status(201).json({
            success: true,
            token,
            user: {
                name: user.name,
                email: user.email,
                role: user.role,
                id: user._id,
            },
        });
    } catch (error) {
        console.error(
            "Register error:",
            error instanceof Error ? error.message : error,
        );
        res.status(500).json({ errMsg: "An error has occurred" });
    }
};

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
});

const login = async (req: Request<{}, {}, loginBody>, res: Response) => {
    try {
        const { value, error } = loginSchema.validate(req.body);
        if (error) {
            console.log("Login validation error:", error.message);
            return res.status(400).json({ errMsg: "invalid request" });
        }
        const { email, password } = value as loginBody;
        console.log("Login attempt for email:", email);
        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found for email:", email);
            return res.status(400).json({ errMsg: "email is not registered" });
        }
        const checkPassword = await user.comparePassword(password);
        if (!checkPassword) {
            console.log("Wrong password for email:", email);
            return res.status(401).json({ errMsg: "wrong password" });
        }
        console.log("Password correct, generating token for user:", email);
        const token = await user.createToken();
        console.log("Token generated successfully");
        
        await logActivity({
            userId: user._id.toString(),
            action: "user_login",
            details: `User logged in: ${user.name} (${user.email})`,
            ipAddress: req.ip || undefined,
            userAgent: req.get("User-Agent") || undefined,
        });
        
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error(
            "Login error:",
            error instanceof Error ? error.message : error,
        );
        res.status(500).json({ errMsg: "internal server error" });
    }
};

interface AuthRequest extends Request {
    user?: { _id: string };
}

const me = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ errMsg: "unauthorized" });
        const user = await User.findById(userId).select("-password");
        if (!user) return res.status(404).json({ errMsg: "user not found" });
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ errMsg: "failed to fetch user data" });
    }
};

const logout = async (req: Request, res: Response) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
        });
        return res.status(200).json({ msg: "logged out" });
    } catch {
        return res.status(500).json({ errMsg: "failed to logout" });
    }
};

export { register, login, me, logout };
