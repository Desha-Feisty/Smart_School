import { Schema, model, Types } from "mongoose";
import type { ICourse } from "./course.js";

export interface IQuiz {
    course: Types.ObjectId | ICourse;
    title: string;
    description?: string;
    openAt: Date;
    closeAt: Date;
    durationMinutes: number;
    attemptsAllowed?: number;
    published?: boolean;
}

const quizSchema = new Schema<IQuiz>({
    course: { type: Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    description: { type: String },
    openAt: { type: Date, required: true },
    closeAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    attemptsAllowed: { type: Number, default: 1 },
    published: { type: Boolean, default: false },
});

export default model<IQuiz>("Quiz", quizSchema);
