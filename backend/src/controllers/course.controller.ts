import Joi from "joi";
import type { Request, Response } from "express";
import Course from "../models/course.js";
import Enrollment from "../models/enrollment.js";
import { startSession } from "mongoose";
import { type AuthRequest } from "../types/authRequest.js";

function createJoinCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const createCourseSchema = Joi.object({
    title: Joi.string().min(2).required(),
    description: Joi.string().allow("").optional(),
});

const createCourse = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || req.user.role !== "teacher") {
            return res.status(403).json({ errMsg: "forbidden" });
        }
        const { value, error } = createCourseSchema.validate(req.body);
        if (error) return res.status(400).json({ errMsg: "Invalid input" });
        const { title, description } = value;
        const course = await Course.create({
            title,
            description,
            joinCode: createJoinCode(),
            teacher: req.user.id,
        });
        res.status(201).json({ msg: "Course created Successfully", course });
    } catch (error) {
        console.error("Failed to create course", error);
        res.status(500).json({ errMsg: "Failed to create course!" });
    }
};

const listMyCourses = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(403).json({ errMsg: "forbidden" });
        if (req.user.role === "teacher") {
            console.log("Teacher listing courses for user:", req.user.id);
            const courses = await Course.find({ teacher: req.user.id });
            return res.status(200).json({ courses });
        } else {
            console.log("Student listing courses for user:", req.user.id);
            const enrollments = await Enrollment.find({
                user: req.user.id,
                status: "active",
            })
                .populate("course")
                .lean();

            const courses = enrollments
                .filter((e) => e.course) // Filter out null courses
                .map((e) => ({
                    ...(e.course as any),
                    enrolledAt: e.createdAt,
                }));
            return res.status(200).json({ courses });
        }
    } catch (error) {
        console.error("Failed to list my courses:", error);
        res.status(500).json({
            errMsg: "failed to list courses",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

const listAllCourses = async (req: Request, res: Response) => {
    try {
        const courses = await Course.find({}).select("-joinCode").lean();
        if (courses.length === 0)
            return res.status(404).json({ errMsg: "no courses found!" });
        res.status(200).json({ numCourses: courses.length, courses });
    } catch (error) {
        console.error("Error listing courses", error);
        res.status(500).json({ errMsg: "failed to list courses!" });
    }
};

const getCourse = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) return res.status(403).json({ errMsg: "forbidden" });
        const { id: courseId } = req.params;
        if (!courseId)
            return res.status(404).json({ errMsg: "invalid courseId" });
        const course = await Course.findById(courseId)
            .select("-joinCode")
            .lean();
        if (!course)
            return res.status(404).json({ errMsg: "error finding course" });
        if (req.user.role === "teacher") {
            if (!req.user || req.user.id !== course.teacher.toString()) {
                return res.status(403).json({ errMsg: "forbidden!" });
            }
        } else {
            const enrollment = Enrollment.findOne({
                user: req.user.id,
                _id: courseId,
                status: "active",
            })
                .select("-joinCode")
                .lean();
            if (!enrollment)
                return res.status(403).json({ errMsg: "forbidden" });
        }
        res.status(200).json({ course });
    } catch (error) {
        console.error("Failed to fetch course", error);
        res.status(500).json({ errMsg: "internal server error!" });
    }
};

const updateCourseSchema = Joi.object({
    title: Joi.string().min(2).optional(),
    description: Joi.string().allow("").optional(),
}).or("title", "description");

const updateCourse = async (req: AuthRequest, res: Response) => {
    try {
        const { error, value } = updateCourseSchema.validate(req.body);
        if (error)
            return res.status(400).json({ error: error.details[0]?.message });
        const { id: courseId } = req.params;
        const course = await Course.findById(courseId);
        if (!course)
            return res.status(404).json({ errMsg: "course not found" });
        if (req.user?.id !== course.teacher.toString()) {
            return res.status(403).json({ errMsg: "forbidden!" });
        }
        if (value.title) course.title = value.title;
        if (value.description) course.description = value.description;
        await course.save();
        res.json({ course });
    } catch (error) {
        console.error({ errMsg: "error updating course", error });
        res.status(500).json({ errMsg: "failed to update course" });
    }
};

const joinSchema = Joi.object({ joinCode: Joi.string().required() });

const joinCourseByCode = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user?.id) return res.status(403).json({ errMsg: "forbidden" });
        const { error, value } = joinSchema.validate(req.body);
        if (error)
            return res
                .status(400)
                .json({ error: error.details[0]?.message || error.message });
        const course = await Course.findOne({ joinCode: value.joinCode });
        if (!course)
            return res.status(404).json({ errMsg: "invalid join code!" });
        await Enrollment.updateOne(
            { course: course._id, user: req.user.id },
            { $setOnInsert: { roleInCourse: "student", status: "active" } },
            { upsert: true },
        );
        res.status(200).json({ course });
    } catch (error) {
        console.error(
            "failed to join course",
            error instanceof Error ? error.message : error,
        );
        res.status(500).json({ errMsg: "failed to join course" });
    }
};

const getRoster = async (req: AuthRequest, res: Response) => {
    try {
        const { id: courseId } = req.params;
        const course = await Course.findById(courseId);
        if (!course)
            return res.status(404).json({ errMsg: "course not found" });
        if (!req.user || req.user.id !== course.teacher.toString()) {
            return res.status(403).json({ errMsg: "forbidden!" });
        }
        const enrollment = await Enrollment.find({
            course: course._id,
            status: "active",
            roleInCourse: "student",
        })
            .populate("user", "name email")
            .lean();
        res.status(200).json({ num: enrollment.length, enrollment });
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to get roster" });
    }
};

const deleteCourse = async (req: AuthRequest, res: Response) => {
    const session = await startSession();
    session.startTransaction();
    try {
        const { id: courseId } = req.params;
        if (!courseId)
            return res.status(404).json({ errMsg: "incorrect course id" });
        const course = await Course.findById(courseId).session(session);
        if (!course) {
            await session.abortTransaction();
            return res.status(404).json({ errMsg: "course not found" });
        }
        if (!req.user || req.user.id !== course.teacher.toString()) {
            await session.abortTransaction();
            return res.status(403).json({ errMsg: "forbidden!" });
        }
        await Enrollment.deleteMany({ course: course._id }).session(session);
        await Course.findByIdAndDelete(courseId).session(session);
        await session.commitTransaction();
        res.status(200).json({ msg: "course successfully deleted" });
    } catch (error) {
        await session.abortTransaction();
        console.error(error instanceof Error ? error.message : error);
        res.status(500).json({ errMsg: "failed to delete course" });
    } finally {
        session.endSession();
    }
};

export {
    getCourse,
    createCourse,
    joinCourseByCode,
    updateCourse,
    deleteCourse,
    getRoster,
    listAllCourses,
    listMyCourses,
};
