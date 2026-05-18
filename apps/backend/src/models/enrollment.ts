import { Schema, model, Types } from "mongoose";
import type { Role } from "../controllers/user.controller.js";
export type CourseStatus = "active" | "removed";
export interface IEnrollment {
    course: Types.ObjectId;
    user: Types.ObjectId;
    roleInCourse: Role;
    status: CourseStatus;
    createdAt: Date;
    updatedAt: Date;
}

const enrollmentSchema = new Schema<IEnrollment>(
    {
        course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
        user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        roleInCourse: {
            type: String,
            enum: ["student", "teacher"],
            default: "student",
            index: true,
        },
        status: {
            type: String,
            enum: ["active", "removed"],
            default: "active",
            index: true,
        },
    },
    { timestamps: true }
);

// Compound indexes
enrollmentSchema.index({ course: 1, user: 1 }, { unique: true });
enrollmentSchema.index({ user: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });

export default model<IEnrollment>("Enrollment", enrollmentSchema);
