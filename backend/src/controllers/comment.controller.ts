import Joi from "joi";
import type { Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import Comment from "../models/comment.js";
import Note from "../models/note.js";
import Enrollment from "../models/enrollment.js";
import Course from "../models/course.js";

const ensureEnrolled = async (userId: string, courseId: string) => {
    const enrolled = await Enrollment.findOne({
        user: userId,
        course: courseId,
        status: "active",
    });
    return !!enrolled;
};

const createCommentSchema = Joi.object({
    content: Joi.string().required().min(1).max(1000),
});

const addComment = async (req: AuthRequest, res: Response) => {
    try {
        const { noteId } = req.params;
        if (!noteId) {
            return res.status(400).json({ errMsg: "Note ID required" });
        }

        const { error, value } = createCommentSchema.validate(req.body);
        if (error) {
            return res
                .status(400)
                .json({ errMsg: error.details[0]?.message || error.message });
        }

        if (!req.user?.id) {
            return res.status(401).json({ errMsg: "Unauthenticated" });
        }

        const note = await Note.findById(noteId)
            .populate("course")
            .populate("teacher");
        if (!note) {
            return res.status(404).json({ errMsg: "Note not found" });
        }

        // Allow access if user is the course teacher OR enrolled as a student
        const isTeacher = (note.teacher as any)?._id.toString() === req.user.id;
        const courseId = (note.course as any)?._id;
        const enrolled = isTeacher
            ? true
            : await ensureEnrolled(req.user.id, courseId);

        if (!enrolled) {
            return res
                .status(403)
                .json({ errMsg: "Not enrolled in this course" });
        }

        const comment = await Comment.create({
            note: noteId,
            user: req.user.id,
            content: value.content,
        });

        await comment.populate("user", "name email");

        res.status(201).json({ comment });
    } catch (error) {
        console.error("Add comment error:", error);
        res.status(500).json({ errMsg: "Failed to add comment" });
    }
};

const deleteComment = async (req: AuthRequest, res: Response) => {
    try {
        const { commentId } = req.params;
        if (!commentId) {
            return res.status(400).json({ errMsg: "Comment ID required" });
        }

        if (!req.user?.id) {
            return res.status(401).json({ errMsg: "Unauthenticated" });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ errMsg: "Comment not found" });
        }

        const note = await Note.findById(comment.note).populate("course");
        if (!note) {
            return res.status(404).json({ errMsg: "Note not found" });
        }

        // Allow deletion if: user is comment author OR user is course teacher
        const isAuthor = comment.user.toString() === req.user.id;
        const isTeacher = (note.teacher as any).toString() === req.user.id;

        if (!isAuthor && !isTeacher) {
            return res.status(403).json({
                errMsg: "Only comment author or course teacher can delete",
            });
        }

        await Comment.deleteOne({ _id: commentId });

        res.json({ ok: true });
    } catch (error) {
        console.error("Delete comment error:", error);
        res.status(500).json({ errMsg: "Failed to delete comment" });
    }
};

const updateCommentSchema = Joi.object({
    content: Joi.string().required().min(1).max(1000),
});

const updateComment = async (req: AuthRequest, res: Response) => {
    try {
        const { commentId } = req.params;
        if (!commentId) {
            return res.status(400).json({ errMsg: "Comment ID required" });
        }

        const { error, value } = updateCommentSchema.validate(req.body);
        if (error) {
            return res
                .status(400)
                .json({ errMsg: error.details[0]?.message || error.message });
        }

        if (!req.user?.id) {
            return res.status(401).json({ errMsg: "Unauthenticated" });
        }

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ errMsg: "Comment not found" });
        }

        // Only comment author can update
        if (comment.user.toString() !== req.user.id) {
            return res
                .status(403)
                .json({ errMsg: "Only comment author can edit" });
        }

        comment.content = value.content;
        await comment.save();
        await comment.populate("user", "name email");

        res.json({ comment });
    } catch (error) {
        console.error("Update comment error:", error);
        res.status(500).json({ errMsg: "Failed to update comment" });
    }
};

export { addComment, deleteComment, updateComment };
