import type { Request, Response } from "express";
import User from "../models/user.js";
import joi from "joi";
import type { Role } from "./user.controller.js";
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
        if (error)
            return res
                .status(400)
                .json({ errMsg: "invalid input", details: error.details });
        const { name, email, password, role } = value as RegisterBody;
        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ msg: "email is already used" });
        const user = await User.create({ email, name, password, role });
        const token = await user.createToken();
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
        res.status(500).json({ errMsg: "An error has occured", error });
    }
};

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required(),
});

const login = async (req: Request<{}, {}, loginBody>, res: Response) => {
    try {
        const { value, error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ errMsg: "invalid request" });
        const { email, password } = value as loginBody;
        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ errMsg: "email is not registered" });
        const checkPassword = await user.comparePassword(password);
        if (!checkPassword)
            return res.status(401).json({ errMsg: "wrong password" });
        const token = await user.createToken();
        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ errMsg: "internal server error" });
    }
};

interface AuthRequest extends Request {
    user?: { id: string };
}

const me = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
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
