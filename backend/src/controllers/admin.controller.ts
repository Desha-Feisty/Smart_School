import type { Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import User from "../models/user.js";
import Course from "../models/course.js";
import Quiz from "../models/quiz.js";
import Attempt from "../models/attempt.js";
import Enrollment from "../models/enrollment.js";
import { Types } from "mongoose";

/**
 * List all users in the system
 */
export const listUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find().select("-password").sort("-createdAt");
        res.status(200).json({ users });
    } catch (error) {
        console.error("Admin listUsers error:", error);
        res.status(500).json({ errMsg: "Failed to fetch users" });
    }
};

/**
 * Add a new user (Student or Teacher)
 */
export const addUser = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        if (!["student", "teacher"].includes(role)) {
            return res.status(400).json({ errMsg: "Invalid role. Only 'student' and 'teacher' can be added." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ errMsg: "Email already in use" });
        }

        const user = new User({ name, email, password, role });
        await user.save();

        res.status(201).json({ user: { id: user._id, name, email, role } });
    } catch (error) {
        console.error("Admin addUser error:", error);
        res.status(500).json({ errMsg: "Failed to create user" });
    }
};

/**
 * Delete a user and cleanup their data
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ errMsg: "User not found" });

        // Cleanup based on role
        if (user.role === "teacher") {
            // Delete courses owned by teacher
            const teacherCourses = await Course.find({ teacher: user._id });
            const courseIds = teacherCourses.map(c => c._id);
            
            // Delete all quizzes in those courses
            await Quiz.deleteMany({ course: { $in: courseIds } });
            // Delete enrollments in those courses
            await Enrollment.deleteMany({ course: { $in: courseIds } });
            // Delete actual courses
            await Course.deleteMany({ teacher: user._id });
        } else if (user.role === "student") {
            // Delete student's attempts and enrollments
            await Attempt.deleteMany({ user: user._id });
            await Enrollment.deleteMany({ user: user._id });
        }

        await User.findByIdAndDelete(id);
        res.status(200).json({ msg: "User and associated data deleted successfully" });
    } catch (error) {
        console.error("Admin deleteUser error:", error);
        res.status(500).json({ errMsg: "Failed to delete user" });
    }
};

/**
 * Get high-level platform statistics
 */
export const getPlatformStats = async (req: AuthRequest, res: Response) => {
    try {
        const [userCount, courseCount, quizCount, attemptCount] = await Promise.all([
            User.countDocuments(),
            Course.countDocuments(),
            Quiz.countDocuments(),
            Attempt.countDocuments({ status: { $in: ["graded", "late"] } })
        ]);

        res.status(200).json({
            stats: {
                totalUsers: userCount,
                totalCourses: courseCount,
                totalQuizzes: quizCount,
                completedAttempts: attemptCount
            }
        });
    } catch (error) {
        console.error("Admin getPlatformStats error:", error);
        res.status(500).json({ errMsg: "Failed to fetch platform stats" });
    }
};

/**
 * Get detailed platform analytics
 */
export const getPlatformAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        // Top Courses by performance/participation
        const courses = await Course.find().populate("teacher", "name");
        
        const courseAnalytics = await Promise.all(courses.map(async (course) => {
            const studentCount = await Enrollment.countDocuments({ course: course._id, status: "active" });
            const quizzes = await Quiz.find({ course: course._id });
            const quizIds = quizzes.map(q => q._id);
            
            const attempts = await Attempt.find({ 
                quiz: { $in: quizIds }, 
                status: { $in: ["graded", "late"] } 
            });

            const avgScore = attempts.length > 0 
                ? attempts.reduce((sum, a) => {
                    const totalPointsPossible = a.responses?.length || 1;
                    return sum + ((a.score || 0) / totalPointsPossible) * 100;
                }, 0) / attempts.length 
                : 0;

            return {
                id: course._id,
                title: course.title,
                teacher: (course.teacher as any)?.name || "Unknown",
                studentCount,
                quizCount: quizzes.length,
                avgScore: Math.round(avgScore),
                participation: attempts.length
            };
        }));

        res.status(200).json({ courseAnalytics });
    } catch (error) {
        console.error("Admin getPlatformAnalytics error:", error);
        res.status(500).json({ errMsg: "Failed to fetch platform analytics" });
    }
};
