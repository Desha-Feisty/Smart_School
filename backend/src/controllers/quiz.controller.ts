import Joi from "joi";
import type { AuthRequest } from "../types/authRequest.js";
import type { Response } from "express";
import Course from "../models/course.js";
import Quiz from "../models/quiz.js";
import Question from "../models/question.js";
import { startSession, Types } from "mongoose";
import Enrollment from "../models/enrollment.js";

const createQuizSchema = Joi.object({
    title: Joi.string().min(2).required(),
    description: Joi.string().allow("").optional(),
    openAt: Joi.alternatives()
        .try(Joi.date().iso(), Joi.string().isoDate())
        .required(),
    closeAt: Joi.alternatives()
        .try(Joi.date().iso(), Joi.string().isoDate())
        .required(),
    attemptsAllowed: Joi.number().min(1).default(1),
    durationMinutes: Joi.number().min(1).required(),
})
    .unknown(true)
    .custom((value, helpers) => {
        try {
            const openDate = new Date(value.openAt);
            const closeDate = new Date(value.closeAt);
            if (openDate >= closeDate) {
                return helpers.error("any.invalid", {
                    message: "openAt must be before closeAt",
                });
            }
            return value;
        } catch (err) {
            return helpers.error("any.invalid", {
                message: "Invalid date format",
            });
        }
    });

const createQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = req.params.id || req.params.courseId;
        console.log("Creating quiz for courseId:", courseId);
        console.log("Request body:", {
            title: req.body.title,
            description: req.body.description,
            openAt: req.body.openAt,
            closeAt: req.body.closeAt,
            durationMinutes: req.body.durationMinutes,
            attemptsAllowed: req.body.attemptsAllowed,
        });

        if (!courseId) {
            return res.status(400).json({
                errMsg: "invalid course id - parameter 'id' is missing",
            });
        }

        if (!req.user || req.user.role !== "teacher") {
            return res.status(403).json({
                errMsg: "forbidden - only teachers can create quizzes",
            });
        }

        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ errMsg: "course not found" });
        }

        const teacherId =
            course.teacher instanceof Types.ObjectId
                ? course.teacher.toString()
                : (course.teacher as any)._id?.toString() ||
                  course.teacher.toString();

        if (teacherId !== req.user.id) {
            console.error(
                `Unauthorized quiz creation attempt: course teacher ${teacherId} vs user ${req.user.id}`,
            );
            return res
                .status(403)
                .json({ errMsg: "forbidden - you do not own this course" });
        }

        const { error, value } = createQuizSchema.validate(req.body);
        if (error) {
            console.error("Validation error:", error.message);
            return res.status(400).json({ errMsg: error.message });
        }

        const quiz = new Quiz({
            course: course._id,
            ...value,
            published: false,
        });
        await quiz.save();

        console.log("Quiz created successfully:", quiz._id);
        res.status(201).json({ quiz });
    } catch (error) {
        console.error("Quiz creation error:", error);
        res.status(500).json({
            errMsg: "Internal server error while creating quiz",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

const addQuestionSchema = Joi.object({
    prompt: Joi.string().min(3).required(),
    points: Joi.number().integer().default(1).min(0),
    orderIndex: Joi.number().integer().min(0).default(0),
    choices: Joi.array()
        .items(
            Joi.object({
                text: Joi.string().required(),
                isCorrect: Joi.boolean().default(false),
            }),
        )
        .min(2)
        .required(),
});

const addQuestion = async (req: AuthRequest, res: Response) => {
    try {
        const { id: quizId } = req.params;
        if (!quizId) {
            return res
                .status(400)
                .json({ errMsg: "please provide valid quiz id" });
        }
        const quiz = await Quiz.findById(quizId).populate({
            path: "course",
            populate: { path: "teacher", select: "_id" },
        });
        if (!quiz) {
            return res.status(404).json({ errMsg: "quiz not found" });
        }
        if (quiz.course instanceof Types.ObjectId) {
            return res.status(500).json({ errMsg: "course was not populated" });
        }
        const teacherId =
            quiz.course.teacher instanceof Types.ObjectId
                ? quiz.course.teacher.toString()
                : quiz.course.teacher._id.toString();
        if (teacherId !== req.user?.id) {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        const { error, value } = addQuestionSchema.validate(req.body);
        if (error)
            return res
                .status(400)
                .json({ error: error.details[0]?.message || error.message });
        const question = await Question.create({
            quiz: quiz._id,
            questionType: "mcq_single",
            ...value,
        });
        res.status(201).json({ question });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to create question" });
    }
};

const addQuestionBodySchema = Joi.object({
    quizId: Joi.string().required(),
    prompt: Joi.string().min(2).required(),
    points: Joi.number().integer().min(0).default(1),
    orderIndex: Joi.number().integer().min(0).default(0),
    choices: Joi.array()
        .items(
            Joi.object({
                text: Joi.string().required(),
                isCorrect: Joi.boolean().default(false),
            }),
        )
        .min(2)
        .required(),
});

const addQuestionViaBody = async (req: AuthRequest, res: Response) => {
    try {
        const { error, value } = addQuestionBodySchema.validate(req.body);
        if (error) {
            return res
                .status(400)
                .json({ errMsg: error.details[0]?.message || error.message });
        }
        const quiz = await Quiz.findById(value.quizId).populate("course");
        if (!quiz) return res.status(404).json({ errMsg: "quiz not found" });
        if (quiz.course instanceof Types.ObjectId) {
            return res
                .status(500)
                .json({ errMsg: "failed to populate course" });
        }
        if (quiz.course.teacher.toString() !== req.user?.id)
            return res.status(403).json({ error: "Forbidden" });
        const q = await Question.create({
            quiz: quiz._id,
            questionType: "mcq_single",
            prompt: value.prompt,
            points: value.points,
            orderIndex: value.orderIndex,
            choices: value.choices,
        });
        res.status(201).json({ question: q });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to create quiz" });
    }
};

const updateQuestionSchema = Joi.object({
    prompt: Joi.string().min(2).optional(),
    points: Joi.number().integer().min(0).optional(),
    orderIndex: Joi.number().integer().min(0).optional(),
    choices: Joi.array()
        .items(
            Joi.object({
                text: Joi.string().required(),
                isCorrect: Joi.boolean().default(false),
            }),
        )
        .min(2)
        .optional(),
}).min(1);

const updateQuestion = async (req: AuthRequest, res: Response) => {
    try {
        const { id: questionId } = req.params;
        if (!questionId) {
            return res.status(400).json({ errMsg: "question id invalid" });
        }
        const { error, value } = updateQuestionSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                errMsg: error.details[0]?.message || error.message,
            });
        }
        const question = await Question.findById(questionId).populate({
            path: "quiz",
            populate: { path: "course" },
        });
        if (!question) {
            return res.status(404).json({ errMsg: "question not found" });
        }
        if (question.quiz instanceof Types.ObjectId) {
            return res
                .status(500)
                .json({ errMsg: "failed to populate course" });
        }
        if (question.quiz.course instanceof Types.ObjectId) {
            return res
                .status(500)
                .json({ errMsg: "failed to populate course" });
        }
        if (question.quiz.course.teacher.toString() !== req.user?.id) {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        if (value.prompt !== undefined) question.prompt = value.prompt;
        if (value.points !== undefined) question.points = value.points;
        if (value.orderIndex !== undefined)
            question.orderIndex = value.orderIndex;
        if (value.choices !== undefined) question.choices = value.choices;
        await question.save();
        res.status(200).json({ question });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to update question" });
    }
};

const deleteQuestion = async (req: AuthRequest, res: Response) => {
    try {
        const { id: questionId } = req.params;
        if (!questionId) {
            return res.status(400).json({ errMsg: "invalid question id" });
        }
        const question = await Question.findById(questionId).populate({
            path: "quiz",
            populate: { path: "course" },
        });
        if (!question) {
            return res.status(404).json({ errMsg: "question not found" });
        }
        if (
            question.quiz instanceof Types.ObjectId ||
            question.quiz.course instanceof Types.ObjectId
        ) {
            return res.status(500).json({ errMsg: "failed to populate" });
        }
        if (question.quiz.course.teacher.toString() !== req.user?.id) {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        await Question.findByIdAndDelete(questionId);
        res.status(200).json({
            msg: "question deleted successfully",
            question,
        });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to delete question" });
    }
};

const publishQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { id: quizId } = req.params;
        if (!quizId) {
            return res.status(400).json({ errMsg: "invalid quiz id" });
        }
        const quiz = await Quiz.findById(quizId).populate({
            path: "course",
            populate: { path: "teacher", select: "_id" },
        });
        if (!quiz) {
            return res.status(404).json({ errMsg: "quiz not found" });
        }
        if (quiz.course instanceof Types.ObjectId) {
            return res.status(500).json({ errMsg: "course not populated" });
        }
        const teacher =
            quiz.course.teacher instanceof Types.ObjectId
                ? quiz.course.teacher.toString()
                : quiz.course.teacher._id.toString();
        if (teacher !== req.user?.id) {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        quiz.published = true;
        await quiz.save();
        res.status(200).json({ quiz });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "could not publish quiz" });
    }
};

const listCourseQuizzes = async (req: AuthRequest, res: Response) => {
    try {
        const courseId = req.params.id || req.params.courseId;
        console.log(
            "Listing quizzes for courseId:",
            courseId,
            "Params:",
            req.params,
        );
        if (!courseId)
            return res.status(400).json({
                errMsg: "invalid course id - parameter 'id' is missing",
            });
        const course = await Course.findById(courseId).select("teacher title");
        if (!course)
            return res.status(404).json({ errMsg: "course not found" });
        if (!req.user?.id)
            return res.status(401).json({ errMsg: "unauthenticated" });
        const isTeacher = course.teacher.toString() === req.user?.id;
        const isStudent = await Enrollment.findOne({
            user: req.user.id,
            course: courseId,
        });
        if (!isTeacher && !isStudent) {
            return res.status(403).json({ errMsg: "unauthorized" });
        }
        const fields = [
            "title",
            "description",
            "openAt",
            "closeAt",
            "durationMinutes",
            "attemptsAllowed",
        ];

        if (isTeacher) fields.push("published", "createdAt");

        const quizzes = await Quiz.find({ course: courseId })
            .select(fields.join(" "))
            .sort("-createdAt");

        const filteredQuizzes = isTeacher
            ? quizzes
            : quizzes.filter((q) => q.published);

        res.json({ course, filteredQuizzes });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "error fetching available quizzes" });
    }
};

const getQuizDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { id: quizId } = req.params;
        if (!quizId) return res.status(400).json({ errMsg: "invalid quiz id" });
        const quiz = await Quiz.findById(quizId).populate("course");
        if (!quiz) return res.status(404).json({ errMsg: "quiz not found" });
        if (quiz.course instanceof Types.ObjectId) {
            return res
                .status(500)
                .json({ errMsg: "failed to populate course" });
        }
        if (!quiz.course || !quiz.course.teacher) {
            return res
                .status(500)
                .json({ errMsg: "failed to populate course" });
        }
        if (!req.user) return res.status(401).json({ errMsg: "forbidden" });
        const isTeacher = quiz.course.teacher.toString() === req.user?.id;
        const isStudent = await Enrollment.exists({
            course: quiz.course,
            user: req.user.id,
            status: "active",
        });
        if (!isTeacher && !isStudent)
            return res.status(403).json({ errMsg: "forbidden" });
        const questions = await Question.find({ quiz: quizId }).sort(
            "orderIndex",
        );
        res.status(200).json({ quiz, questions });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to fetch quizz" });
    }
};

const updateQuizSchema = Joi.object({
    title: Joi.string().min(2).required(),
    description: Joi.string().allow("").optional(),
    openAt: Joi.date().optional(),
    closeAt: Joi.date().optional(),
    attemptsAllowed: Joi.number().min(1).default(1),
    durationMinutes: Joi.number().min(1).optional(),
}).custom((value, helpers) => {
    if (
        value.openAt &&
        value.closeAt &&
        new Date(value.openAt) >= new Date(value.closeAt)
    ) {
        return helpers.error("any.invalid", {
            message: "openAt must be before closeAt",
        });
    }
});

const listAvailableQuizzes = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ errMsg: "unauthenticated" });
        }
        const enrollments = await Enrollment.find({ user: req.user.id });
        const courseIds = enrollments.map((e) => e.course);
        if (courseIds.length === 0) {
            return res.status(200).json({ quizzes: [] });
        }
        const now = new Date();
        const quizzes = await Quiz.find({
            course: { $in: courseIds },
            published: true,
            openAt: { $lte: now },
            closeAt: { $gte: now },
        })
            .populate("course")
            .select("-published")
            .sort({ closeAt: -1 });
        res.status(200).json({ quizzes });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to fetch quizzes" });
    }
};

const updateQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { id: quizId } = req.params;
        if (!quizId) return res.status(400).json({ errMsg: "invalid quiz id" });
        const { error, value } = updateQuizSchema.validate(req.body);
        if (error)
            return res.status(400).json({ errMsg: error.message || error });
        const quiz = await Quiz.findById(quizId).populate("course");
        if (!quiz) return res.status(404).json({ errMsg: "quiz not found" });
        if (!req.user || !req.user.id) {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        if (quiz.course instanceof Types.ObjectId) {
            return res
                .status(500)
                .json({ errMsg: "failed to populate course" });
        }
        if (quiz.course.teacher.toString() !== req.user.id) {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        if (value.title !== undefined) quiz.title = value.title;
        if (value.description !== undefined)
            quiz.description = value.description;
        if (value.openAt !== undefined) quiz.openAt = value.openAt;
        if (value.closeAt !== undefined) quiz.closeAt = value.closeAt;
        if (value.durationMinutes !== undefined) {
            quiz.durationMinutes = value.durationMinutes;
        }
        if (value.attemptsAllowed !== undefined) {
            quiz.attemptsAllowed = value.attemptsAllowed;
        }
        await quiz.save();
        res.status(200).json({ quiz });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to update quiz" });
    }
};

const deleteQuiz = async (req: AuthRequest, res: Response) => {
    try {
        const { id: quizId } = req.params;
        if (!quizId) return res.status(400).json({ errMsg: "invalid quiz id" });
        if (!req.user || !req.user.id) {
            return res.status(403).json({ errMsg: "forbidden - missing auth" });
        }

        const quiz = await Quiz.findById(quizId).populate("course");
        if (!quiz) {
            return res.status(404).json({ errMsg: "quiz not found" });
        }

        if (!quiz.course || quiz.course instanceof Types.ObjectId) {
            return res
                .status(500)
                .json({ errMsg: "failed to populate course info" });
        }

        const teacherId = (quiz.course as any).teacher?.toString();
        if (teacherId !== req.user.id) {
            return res
                .status(403)
                .json({ errMsg: "forbidden - you do not own this course" });
        }

        // Delete all associated questions first
        await Question.deleteMany({ quiz: quiz._id });

        // Delete the quiz itself
        const deletedQuiz = await Quiz.findByIdAndDelete(quizId);

        res.status(200).json({ msg: "quiz deleted successfully", deletedQuiz });
    } catch (error) {
        console.error("Delete quiz error:", error);
        res.status(500).json({
            errMsg: "failed to delete quiz",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

const createQuizFromBody = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId, ...payload } = req.body || {};
        if (!courseId)
            return res.status(400).json({ errMsg: "invalid course id" });
        const { error, value } = createQuizSchema.validate(payload);
        if (error) {
            return res
                .status(400)
                .json({ errMsg: error.details[0]?.message || error.message });
        }
        const course = await Course.findById(courseId);
        if (!course)
            return res.status(404).json({ errMsg: "course not found" });
        if (course.teacher.toString() !== req.user?.id) {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        const quiz = await Quiz.create({
            course: course._id,
            ...value,
            published: false,
        });
        res.status(201).json({ quiz });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to create quiz" });
    }
};

export {
    createQuiz,
    createQuizFromBody,
    addQuestion,
    addQuestionViaBody,
    updateQuestion,
    deleteQuestion,
    publishQuiz,
    listCourseQuizzes,
    listAvailableQuizzes,
    getQuizDetails,
    updateQuiz,
    deleteQuiz,
};
