import Joi from "joi";
import type { Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import Attempt from "../models/attempt.js";
import Quiz from "../models/quiz.js";
import Course from "../models/course.js";
import Question from "../models/question.js";
import type { IQuestion } from "../models/question.js";
import Enrollment from "../models/enrollment.js";
import dayjs from "dayjs";
import { Types } from "mongoose";
import type { IQuiz } from "../models/quiz.js";
import quiz from "../models/quiz.js";
const ensureEnrollment = async (userId: string, courseId: string) => {
    const enrolled = await Enrollment.findOne({
        user: userId,
        course: courseId,
    });
    return !!enrolled && enrolled.status === "active";
};

const countAttempts = async (userId: string, quizId: string) => {
    return Attempt.countDocuments({ user: userId, quiz: quizId });
};

const startAttempt = async (req: AuthRequest, res: Response) => {
    try {
        const { quizId } = req.params;
        if (!quizId) {
            return res.status(400).json({ errMsg: "invalid quiz id" });
        }
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(500).json({ errMsg: "quiz not found" });
        }
        const now = dayjs();
        if (!quiz.published) {
            return res.status(400).json({ errMsg: "quiz unavailable" });
        }
        if (now.isBefore(dayjs(quiz.openAt))) {
            return res.status(400).json({ errMsg: "quiz not open yet" });
        }
        if (now.isAfter(dayjs(quiz.closeAt))) {
            return res.status(400).json({ errMsg: "quiz is closed" });
        }
        if (!req.user || !req.user.id) {
            return res.status(401).json({ errMsg: "unauthenticated" });
        }
        const enrolled = await ensureEnrollment(
            req.user.id,
            quiz.course.toString(),
        );
        if (!enrolled) {
            return res.status(403).json({ errMsg: "not enrolled in course" });
        }
        await Attempt.updateMany(
            {
                user: req.user.id,
                quiz: quiz._id,
                status: "inProgress",
                endAt: { $lte: now.toDate() },
            },
            { $set: { status: "expired" } },
        );
        const activeAttempt = await Attempt.findOne({
            user: req.user.id,
            quiz: quiz._id,
            status: "inProgress",
            endAt: { $gt: now.toDate() },
        }).lean();
        if (activeAttempt) {
            const questions = await Question.find({ quiz: quiz._id })
                .sort({ orderIndex: 1 })
                .lean();
            return res.status(200).json({
                attemptId: activeAttempt._id,
                endAt: activeAttempt.endAt,
                questions: questions.map((q) => ({
                    id: q._id,
                    prompt: q.prompt,
                    choices: q.choices.map((c) => ({
                        id: c._id,
                        text: c.text,
                    })),
                })),
            });
        }
        const taken = await countAttempts(req.user.id, quizId);
        if (taken >= (quiz.attemptsAllowed || 1)) {
            return res.status(400).json({
                errMsg: `Attempts exhausted (${taken}/${
                    quiz.attemptsAllowed || 1
                } used)`,
            });
        }
        const durationEnd = now.add(quiz.durationMinutes, "minute");
        const quizEnd = dayjs(quiz.closeAt);
        const endAt = durationEnd.isBefore(quizEnd)
            ? durationEnd.toDate()
            : quizEnd.toDate();
        const questions = await Question.find({ quiz: quiz._id })
            .sort({ orderIndex: 1 })
            .lean();
        const responses = questions.map((q) => ({
            question: q._id,
            selectedChoiceIds: [],
            pointsAwarded: 0,
        }));
        const attempt = await Attempt.create({
            quiz: quiz._id,
            user: req.user.id,
            startAt: now.toDate(),
            endAt,
            responses,
        });
        res.status(201).json({
            attemptId: attempt._id,
            endAt,
            questions: questions.map((q) => ({
                id: q._id,
                prompt: q.prompt,
                choices: q.choices.map((c) => ({
                    id: c._id,
                    text: c.text,
                })),
            })),
        });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to start attempt" });
    }
};

const autoSaveSchema = Joi.object({
    questionId: Joi.string().required(),
    selectedChoiceIds: Joi.array().items(Joi.string()).required(),
});
const autoSaveAnswer = async (req: AuthRequest, res: Response) => {
    try {
        const { error, value } = autoSaveSchema.validate(req.body);
        if (error) {
            return res
                .status(400)
                .json({ errMsg: error.details[0]?.message || error.message });
        }
        const { attemptId } = req.params;
        const attempt = await Attempt.findById(attemptId);
        if (!attempt) {
            return res.status(404).json({ errMsg: "attempt not found" });
        }
        const now = dayjs();
        if (now.isAfter(dayjs(attempt.endAt))) {
            return res.status(400).json({ error: "Attempt expired" });
        }
        const resp = attempt.responses.find(
            (r) => r.question.toString() === value.questionId,
        );
        if (!resp) return res.status(404).json({ error: "Response not found" });
        resp.selectedChoiceIds = value.selectedChoiceIds;
        await attempt.save();
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ errMsg: "Autosave failed" });
    }
};

const submitAttempt = async (req: AuthRequest, res: Response) => {
    try {
        const { attemptId } = req.params;
        const attempt = await Attempt.findById(attemptId).populate({
            path: "responses.question",
            model: "Question",
        });
        if (!attempt)
            return res.status(404).json({ error: "Attempt not found" });
        if (attempt.user.toString() !== req.user?.id)
            return res.status(403).json({ error: "Forbidden" });
        const now = dayjs();
        if (now.isAfter(dayjs(attempt.endAt))) {
            attempt.status = "expired";
            await attempt.save();
            return res.status(400).json({ error: "Attempt expired" });
        }
        // Auto-grade MCQ single
        let total = 0;
        for (const resp of attempt.responses) {
            const q = resp.question as unknown as IQuestion;

            const correctChoice = q.choices.find((c) => c.isCorrect);
            const isCorrect =
                correctChoice &&
                resp.selectedChoiceIds.length === 1 &&
                resp.selectedChoiceIds[0].toString() ===
                    correctChoice._id?.toString();
            resp.pointsAwarded = isCorrect ? q.points || 1 : 0;
            total += resp.pointsAwarded;
        }
        attempt.score = total;
        attempt.status = "graded";
        attempt.submittedAt = now.toDate();
        await attempt.save();
        console.log("Attempt submitted:", {
            id: attempt._id,
            submittedAt: attempt.submittedAt,
            status: attempt.status,
            score: attempt.score,
        });
        res.json({ attempt: attempt });
    } catch (err) {
        res.status(500).json({ error: "Submit failed" });
    }
};

const getResult = async (req: AuthRequest, res: Response) => {
    try {
        const { attemptId } = req.params;
        const attempt = await Attempt.findById(attemptId).populate({
            path: "responses.question",
            model: "Question",
        });
        if (!attempt)
            return res.status(404).json({ error: "Attempt not found" });
        if (attempt.user.toString() !== req.user?.id)
            return res.status(403).json({ error: "Forbidden" });
        res.json({
            status: attempt.status,
            score: attempt.score,
            submittedAt: attempt.submittedAt,
        });
    } catch (err) {
        res.status(500).json({ error: "Get result failed" });
    }
};

const listQuizGrades = async (req: AuthRequest, res: Response) => {
    try {
        const { id: quizId } = req.params;
        const quiz = await Quiz.findById(quizId).populate("course");
        if (!quiz) return res.status(404).json({ error: "Quiz not found" });
        if (quiz.course instanceof Types.ObjectId) {
            return res.status(403).json({ error: "Forbidden" });
        }
        if (!quiz.course?.teacher)
            return res.status(403).json({ error: "Forbidden" });
        if (quiz.course.teacher.toString() !== req.user?.id)
            return res.status(403).json({ error: "Forbidden" });
        const attempts = await Attempt.find({
            quiz: quiz._id,
            status: "graded",
        })
            .populate("user", "name email")
            .select("user score submittedAt status responses")
            .sort({ submittedAt: -1 })
            .lean();
        const results = attempts.map((a) => {
            // Calculate total possible points from responses
            const totalPossiblePoints = a.responses?.length || 0;
            const scorePercentage =
                totalPossiblePoints > 0 && a.score !== undefined
                    ? Math.round((a.score / totalPossiblePoints) * 100)
                    : 0;

            return {
                attemptId: a._id,
                student: a.user,
                score: scorePercentage,
                submittedAt: a.submittedAt,
                status: a.status,
            };
        });
        res.json({
            quiz: {
                _id: quiz._id,
                title: (quiz as any)?.title || "Unknown Quiz",
            },
            results,
        });
    } catch (err) {
        res.status(500).json({ error: "List grades failed" });
    }
};

const listMyGrades = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(401).json({ errMsg: "forbidden" });
        const attempts = await Attempt.find({
            user: req.user.id,
            status: "graded",
        })
            .populate({
                path: "quiz",
                select: "title course",
                populate: { path: "course", select: "title" },
            })
            .select("quiz score submittedAt status responses")
            .sort({ submittedAt: -1 })
            .lean();
        if (!attempts || attempts.length === 0)
            return res.status(404).json({ error: "No attempts found" });

        const results = attempts.map((a) => {
            // Calculate total possible points from responses
            const totalPossiblePoints = a.responses?.length || 0;
            const scorePercentage =
                totalPossiblePoints > 0 && a.score !== undefined
                    ? Math.round((a.score / totalPossiblePoints) * 100)
                    : 0;

            return {
                attemptId: a._id,
                quiz: {
                    _id: a.quiz?._id,
                    title: (a.quiz as any)?.title || "Unknown Quiz",
                },
                course: {
                    _id: (a.quiz as any)?.course?._id,
                    title: (a.quiz as any)?.course?.title || "Unknown Course",
                },
                score: scorePercentage,
                submittedAt: a.submittedAt,
                status: a.status,
            };
        });
        res.json({ results });
    } catch (err) {
        console.error("listMyGrades error:", err);
        res.status(500).json({ error: "List my grades failed" });
    }
};

const startAttemptFromBody = async (req: AuthRequest, res: Response) => {
    try {
        const { quizId } = req.body || {};
        if (!quizId)
            return res.status(400).json({ error: "quizId is required" });
        req.params.quizId = quizId;
        return startAttempt(req, res);
    } catch (err) {
        res.status(500).json({ error: "Start attempt failed" });
    }
};

const getAttemptDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { attemptId } = req.params;
        const attempt = await Attempt.findById(attemptId)
            .populate({ path: "responses.question", model: "Question" })
            .populate({
                path: "quiz",
                select: "title course",
                populate: { path: "course", select: "title" },
            });
        if (!attempt)
            return res.status(404).json({ error: "Attempt not found" });
        if (attempt.user.toString() !== req.user?.id)
            return res.status(403).json({ error: "Forbidden" });
        const resp = attempt.responses.map((r) => ({
            questionId: r.question?._id,
            prompt: (r.question as unknown as IQuestion)?.prompt,
            selectedChoiceIds: r.selectedChoiceIds,
            pointsAwarded: r.pointsAwarded,
        }));
        if (attempt.quiz instanceof Types.ObjectId) {
            return res.status(500).json({ errMsg: "server error" });
        }
        res.json({
            attempt: {
                _id: attempt._id,
                status: attempt.status,
                score: attempt.score,
                startedAt: attempt.startAt,
                endAt: attempt.endAt,
                submittedAt: attempt.submittedAt,
            },
            quiz: {
                _id: attempt.quiz?._id,
                title: (attempt.quiz as any)?.title || "Unknown Quiz",
            },
            course: {
                _id: (attempt.quiz as any)?.course?._id,
                title: (attempt.quiz as any)?.course?.title || "Unknown Course",
            },
            responses: resp,
        });
        console.log("Get attempt details response:", {
            attemptId: attempt._id,
            submittedAt: attempt.submittedAt,
            startedAt: attempt.startAt,
            status: attempt.status,
        });
    } catch (err) {
        res.status(500).json({ error: "Get attempt details failed" });
    }
};

const getStudentCourseGrades = async (req: AuthRequest, res: Response) => {
    try {
        const { studentId, courseId } = req.params;

        // Verify the requester is the course teacher
        const course = await Course.findById(courseId);
        if (!course) return res.status(404).json({ error: "Course not found" });
        if (!req.user || req.user.id !== course.teacher.toString()) {
            return res.status(403).json({ error: "Forbidden" });
        }

        const attempts = await Attempt.find({
            user: new Types.ObjectId(studentId),
            status: "graded",
        })
            .populate({
                path: "quiz",
                select: "title course",
                match: { course: courseId }, // Only quizzes from this course
                populate: { path: "course", select: "title" },
            })
            .select("quiz score submittedAt status responses")
            .sort({ submittedAt: -1 })
            .lean();

        // Filter out attempts where quiz population failed (not from this course)
        const courseAttempts = attempts.filter((a) => a.quiz);

        const results = courseAttempts.map((a) => {
            // Calculate total possible points from responses
            const totalPossiblePoints = a.responses?.length || 0;
            const scorePercentage =
                totalPossiblePoints > 0 && a.score !== undefined
                    ? Math.round((a.score / totalPossiblePoints) * 100)
                    : 0;

            return {
                attemptId: a._id,
                quiz: {
                    _id: a.quiz?._id,
                    title: (a.quiz as any)?.title || "Unknown Quiz",
                },
                score: scorePercentage,
                submittedAt: a.submittedAt,
                status: a.status,
            };
        });

        res.json({ results });
    } catch (err) {
        console.error("getStudentCourseGrades error:", err);
        res.status(500).json({ error: "Failed to get student course grades" });
    }
};

export {
    startAttempt,
    autoSaveAnswer,
    submitAttempt,
    getResult,
    listQuizGrades,
    listMyGrades,
    startAttemptFromBody,
    getStudentCourseGrades,
    getAttemptDetails,
};
