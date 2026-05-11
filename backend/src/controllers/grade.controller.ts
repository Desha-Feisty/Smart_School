import type { Request, Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import Course from "../models/course.js";
import Enrollment from "../models/enrollment.js";
import Attempt from "../models/attempt.js";
import Quiz from "../models/quiz.js";
import User from "../models/user.js";

// Get student grades for teacher
export const getStudentGrades = async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user?._id;
        const { studentId } = req.params;

        if (!teacherId || req.user?.role !== "teacher") {
            return res.status(403).json({ errMsg: "Only teachers can access student grades" });
        }

        if (!studentId) {
            return res.status(400).json({ errMsg: "Student ID is required" });
        }

        // Verify teacher owns courses with this student
        const teacherCourses = await Course.find({ teacher: teacherId }).select("_id");
        const courseIds = teacherCourses.map((c) => c._id);

        // Check if student is enrolled in teacher's courses
        const enrollment = await Enrollment.findOne({
            user: studentId,
            course: { $in: courseIds },
            status: "active",
            roleInCourse: "student",
        });

        if (!enrollment) {
            return res.status(404).json({ errMsg: "Student not enrolled in your courses" });
        }

        // Get student info
        const student = await User.findById(studentId).select("name email").lean();
        if (!student) {
            return res.status(404).json({ errMsg: "Student not found" });
        }

        // Get per-course grades
        const enrollments = await Enrollment.find({
            user: studentId,
            course: { $in: courseIds },
            status: "active",
        }).populate("course", "title");

        const perCourseGrades: any[] = [];
        let totalScore = 0;
        let totalMaxScore = 0;

        for (const enroll of enrollments) {
            const course = enroll.course as any;
            
            // Get all graded attempts for quizzes in this course
            const quizzes = await Quiz.find({ course: course._id, published: true }).select("_id");
            const quizIds = quizzes.map((q) => q._id);

            const attempts = await Attempt.find({
                user: studentId,
                quiz: { $in: quizIds },
                status: "graded",
            }).populate("quiz", "title maxScore pointsPerQuestion");

            const courseAttempts = attempts.filter((a) => a.maxScore && a.maxScore > 0);
            const courseScore = courseAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
            const courseMaxScore = courseAttempts.reduce((sum, a) => sum + (a.maxScore || 0), 0);

            const courseGrade = courseMaxScore > 0 ? Math.round((courseScore / courseMaxScore) * 100) : null;

            perCourseGrades.push({
                courseId: course._id,
                courseTitle: course.title,
                grade: courseGrade,
                maxGrade: 100,
                completedQuizzes: courseAttempts.length,
                totalQuizzes: quizIds.length,
            });

            if (courseMaxScore > 0) {
                totalScore += courseScore;
                totalMaxScore += courseMaxScore;
            }
        }

        // Calculate overall average
        const overallAverage = totalMaxScore > 0 
            ? Math.round((totalScore / totalMaxScore) * 100) 
            : null;

        // Get recent activity (last 5 graded attempts across all teacher's courses)
        const recentAttempts = await Attempt.find({
            user: studentId,
            quiz: { $in: 
                await Quiz.find({ course: { $in: courseIds } }).select("_id").then((qs) => qs.map((q) => q._id))
            },
            status: "graded",
        })
        .sort({ submittedAt: -1 })
        .limit(5)
        .populate("quiz", "title")
        .lean();

        const recentActivity = recentAttempts.map((a: any) => ({
            quizId: a.quiz._id,
            quizTitle: a.quiz.title,
            score: a.score,
            maxScore: a.maxScore,
            percentage: a.maxScore > 0 ? Math.round((a.score / a.maxScore) * 100) : null,
            submittedAt: a.submittedAt || a.endAt,
        }));

        // Check for existing chat in any course
        const firstEnrollment = enrollments[0];
        const hasExistingChat = firstEnrollment ? true : false;

        return res.status(200).json({
            student: {
                _id: student._id,
                name: student.name,
                email: student.email,
            },
            perCourseGrades,
            overallAverage,
            recentActivity,
            hasExistingChat,
            courseId: firstEnrollment?.course?._id,
        });
    } catch (error) {
        console.error("Error fetching student grades:", error);
        return res.status(500).json({ errMsg: "Failed to fetch student grades" });
    }
};