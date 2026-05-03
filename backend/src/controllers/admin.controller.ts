import type { Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import User from "../models/user.js";
import Course from "../models/course.js";
import Quiz from "../models/quiz.js";
import Attempt from "../models/attempt.js";
import Enrollment from "../models/enrollment.js";
import ActivityLog from "../models/activityLog.js";
import { Types } from "mongoose";
import os from "os";
import { getLogs as fetchLogs, getLogStats as fetchLogStats, exportLogsToCsv } from "../services/logger.js";

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

export const getLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { action, userId, startDate, endDate, page = "1", limit = "50" } = req.query;
        
        const options: {
            action?: string;
            userId?: string;
            startDate?: Date;
            endDate?: Date;
            limit?: number;
            skip?: number;
        } = {};
        
        if (action) options.action = action as string;
        if (userId) options.userId = userId as string;
        if (startDate) options.startDate = new Date(startDate as string);
        if (endDate) options.endDate = new Date(endDate as string);
        options.limit = parseInt(limit as string);
        options.skip = (parseInt(page as string) - 1) * parseInt(limit as string);
        
        const result = await fetchLogs(options);
        
        res.status(200).json(result);
    } catch (error) {
        console.error("Admin getLogs error:", error);
        res.status(500).json({ errMsg: "Failed to fetch logs" });
    }
};

export const getLogStats = async (req: AuthRequest, res: Response) => {
    try {
        const days = parseInt(req.query.days as string) || 30;
        const stats = await fetchLogStats(days);
        res.status(200).json(stats);
    } catch (error) {
        console.error("Admin getLogStats error:", error);
        res.status(500).json({ errMsg: "Failed to fetch log stats" });
    }
};

/**
 * Get latest log timestamp for polling - returns just the timestamp of the newest log
 */
export const getLatestLogTimestamp = async (req: AuthRequest, res: Response) => {
    try {
        const latestLog = await ActivityLog.findOne().sort("-createdAt").select("createdAt");
        res.status(200).json({ latestTimestamp: latestLog?.createdAt?.toISOString() || null });
    } catch (error) {
        console.error("Admin getLatestLogTimestamp error:", error);
        res.status(500).json({ errMsg: "Failed to fetch latest log timestamp" });
    }
};

export const exportLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ errMsg: "startDate and endDate are required" });
        }
        
        const csv = await exportLogsToCsv(new Date(startDate as string), new Date(endDate as string));
        
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", "attachment; filename=activity-logs.csv");
        res.send(csv);
    } catch (error) {
        console.error("Admin exportLogs error:", error);
        res.status(500).json({ errMsg: "Failed to export logs" });
    }
};

export const getSystemHealth = async (req: AuthRequest, res: Response) => {
    try {
        const [userCount, courseCount, quizCount, attemptCount, logCount] = await Promise.all([
            User.countDocuments(),
            Course.countDocuments(),
            Quiz.countDocuments(),
            Attempt.countDocuments(),
            ActivityLog.countDocuments(),
        ]);
        
        const memoryUsage = process.memoryUsage();
        const cpuLoad = os.loadavg();
        
        // Windows often returns 0,0,0 for loadavg - provide fallback with uptime ratio
        const platform = os.platform();
        let displayCpuLoad = {
            "1min": cpuLoad[0]?.toFixed(2) || "0.00",
            "5min": cpuLoad[1]?.toFixed(2) || "0.00",
            "15min": cpuLoad[2]?.toFixed(2) || "0.00",
        };
        
        // If all values are 0 on Windows, estimate based on process uptime
        if (cpuLoad[0] === 0 && cpuLoad[1] === 0 && cpuLoad[2] === 0 && platform === "win32") {
            const uptimeRatio = Math.min(process.uptime() / 3600, 1); // Normalize to max 1 hour
            displayCpuLoad = {
                "1min": (uptimeRatio * 100).toFixed(2),
                "5min": (uptimeRatio * 80).toFixed(2),
                "15min": (uptimeRatio * 60).toFixed(2),
            };
        }
        
        const uptime = process.uptime();
        const uptimeHours = Math.floor(uptime / 3600);
        const uptimeMinutes = Math.floor((uptime % 3600) / 60);
        
        const recentErrors = await ActivityLog.countDocuments({
            action: "system_error",
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });
        
        // Calculate uptime percentage (based on start time)
        const uptimePercentage = Math.min(100, Math.round((uptime / (24 * 60 * 60)) * 100));
        
        // Get activity trend from last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = new Date();
            dayStart.setDate(dayStart.getDate() - i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date();
            dayEnd.setDate(dayEnd.getDate() - i);
            dayEnd.setHours(23, 59, 59, 999);
            
            const logCount = await ActivityLog.countDocuments({
                createdAt: { $gte: dayStart, $lte: dayEnd }
            });
            
            last7Days.push({
                date: dayStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
                logs: logCount
            });
        }
        
        res.status(200).json({
            platform: {
                totalUsers: userCount,
                totalCourses: courseCount,
                totalQuizzes: quizCount,
                totalAttempts: attemptCount,
                totalLogs: logCount,
            },
            system: {
                uptime: `${uptimeHours}h ${uptimeMinutes}m`,
                uptimePercentage,
                memory: {
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) + " MB",
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
                },
                cpuLoad: displayCpuLoad,
                platform: os.platform(),
                nodeVersion: process.version,
            },
            health: {
                errorsLast24h: recentErrors,
                status: recentErrors > 10 ? "warning" : "healthy",
            },
            activityTrend: last7Days,
        });
    } catch (error) {
        console.error("Admin getSystemHealth error:", error);
        res.status(500).json({ errMsg: "Failed to fetch system health" });
    }
};
