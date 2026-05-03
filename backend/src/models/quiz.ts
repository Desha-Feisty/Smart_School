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
    questionsPerAttempt?: number;
    published?: boolean;
    gradingMode?: "onSubmit" | "onClose";
}

const quizSchema = new Schema<IQuiz>({
    course: { type: Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    description: { type: String },
    openAt: { type: Date, required: true },
    closeAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true },
    attemptsAllowed: { type: Number, default: 1 },
    questionsPerAttempt: { type: Number },
    published: { type: Boolean, default: false },
    gradingMode: { type: String, enum: ["onSubmit", "onClose"], default: "onSubmit" },
});

quizSchema.index({ closeAt: 1 });

export default model<IQuiz>("Quiz", quizSchema);
