import { Router } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import Course from "../models/course.js";
import Note from "../models/note.js";
import Quiz from "../models/quiz.js";
import Enrollment from "../models/enrollment.js";
import { Types } from "mongoose";

const router = Router();

// Search endpoint - searches courses, notes, and quizzes
router.get("/", async (req: AuthRequest, res) => {
    try {
        const { q, type } = req.query;
        
        if (!q || typeof q !== "string" || q.trim().length < 2) {
            return res.status(400).json({ errMsg: "Search query must be at least 2 characters" });
        }

        const query = q.trim();
        const userId = req.user?._id;
        const role = req.user?.role;

        const results: { courses: any[], notes: any[], quizzes: any[] } = {
            courses: [],
            notes: [],
            quizzes: [],
        };

        // Search courses - teachers see all, students see enrolled
        if (!type || type === "courses") {
            let courseQuery = Course.find({
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                ],
            });

            if (role === "student" && userId) {
                const enrollments = await Enrollment.find({ user: userId, status: "active" }).select("course");
                const enrolledCourseIds = enrollments.map((e) => e.course);
                courseQuery = courseQuery.find({ _id: { $in: enrolledCourseIds } });
            } else if (role === "teacher" && userId) {
                courseQuery = courseQuery.find({ teacher: userId });
            }

            results.courses = await courseQuery
                .limit(10)
                .select("title description joinCode teacher")
                .populate("teacher", "name")
                .lean();
        }

        // Search notes
        if (!type || type === "notes") {
            let noteQuery = Note.find({
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { content: { $regex: query, $options: "i" } },
                ],
            });

            // Teachers see notes for their courses, students see notes for enrolled courses
            if (role === "teacher" && userId) {
                const teacherCourses = await Course.find({ teacher: userId }).select("_id");
                const courseIds = teacherCourses.map((c) => c._id);
                noteQuery = noteQuery.find({ course: { $in: courseIds } });
            } else if (role === "student" && userId) {
                const enrollments = await Enrollment.find({ user: userId, status: "active" }).select("course");
                const courseIds = enrollments.map((e) => e.course);
                noteQuery = noteQuery.find({ course: { $in: courseIds } });
            }

            results.notes = await noteQuery
                .limit(10)
                .select("title content course createdAt")
                .populate("course", "title")
                .lean();
        }

        // Search quizzes - only published for students
        if (!type || type === "quizzes") {
            let quizQuery = Quiz.find({
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } },
                ],
            });

            if (role === "student" && userId) {
                const enrollments = await Enrollment.find({ user: userId, status: "active" }).select("course");
                const enrolledCourseIds = enrollments.map((e) => e.course);
                quizQuery = quizQuery.find({
                    course: { $in: enrolledCourseIds },
                    published: true,
                });
            } else if (role === "teacher" && userId) {
                const teacherCourses = await Course.find({ teacher: userId }).select("_id");
                const courseIds = teacherCourses.map((c) => c._id);
                quizQuery = quizQuery.find({ course: { $in: courseIds } });
            }

            results.quizzes = await quizQuery
                .limit(10)
                .select("title description durationMinutes openAt closeAt course")
                .populate("course", "title")
                .lean();
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error("Search error:", error);
        return res.status(500).json({ errMsg: "Search failed" });
    }
});

export default router;