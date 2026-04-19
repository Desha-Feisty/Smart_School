import type { Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import Attempt from "../models/attempt.js";
import Quiz from "../models/quiz.js";
import Course from "../models/course.js";
import Enrollment from "../models/enrollment.js";
import { Types } from "mongoose";

const getCourseAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found" });

        // Verify teacher role
        if (!req.user || req.user.id !== course.teacher.toString()) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const quizzes = await Quiz.find({ course: courseId as any });
        const quizIds = quizzes.map(q => (q as any)._id);

        const enrollments = await Enrollment.countDocuments({ course: courseId as any, status: "active" });

        // Aggregate stats per quiz
        const quizStats = await Promise.all(quizzes.map(async (quiz) => {
            const attempts = await Attempt.find({ 
                quiz: (quiz as any)._id, 
                status: { $in: ["graded", "late"] } 
            });

            // Calculate percentage per attempt and then average them
            const avgScore = attempts.length > 0 
                ? attempts.reduce((sum, a) => {
                    const totalPointsPossible = a.responses?.length || 1;
                    const percentage = ( (a.score || 0) / totalPointsPossible ) * 100;
                    return sum + percentage;
                }, 0) / attempts.length 
                : 0;

            const participation = enrollments > 0 
                ? (attempts.length / enrollments) * 100 
                : 0;

            return {
                quizId: (quiz as any)._id,
                title: quiz.title,
                avgScore: Math.round(avgScore),
                participation: Math.round(participation),
                attemptCount: attempts.length
            };
        }));

        res.json({
            courseTitle: course.title,
            studentCount: enrollments,
            quizStats
        });
    } catch (err) {
        console.error("Course analytics error:", err);
        res.status(500).json({ error: "Failed to fetch course analytics" });
    }
};

const getStudentProgress = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        const studentId = req.user?.id;
        if (!studentId) return res.status(401).json({ error: "Unauthorized" });

        // Find all attempts for this student in this course
        const quizzes = await Quiz.find({ course: courseId as any }).select("_id title openAt");
        const quizIds = quizzes.map(q => (q as any)._id);

        const attempts = await Attempt.find({
            user: studentId,
            quiz: { $in: quizIds },
            status: { $in: ["graded", "late"] }
        }).sort({ submittedAt: 1 });

        const history = attempts.map(a => {
            const quiz = quizzes.find(q => q._id.toString() === a.quiz.toString());
            const totalPointsPossible = a.responses?.length || 1;
            const scorePercentage = Math.round(((a.score || 0) / totalPointsPossible) * 100);
            
            return {
                quizTitle: quiz?.title || "Unknown",
                score: scorePercentage,
                date: a.submittedAt
            };
        });

        res.json({ history });
    } catch (err) {
        console.error("Student progress error:", err);
        res.status(500).json({ error: "Failed to fetch student progress" });
    }
};

export { getCourseAnalytics, getStudentProgress };
