import { Schema, Types, model } from "mongoose";

export interface ICourse {
    title: string;
    description?: string;
    joinCode: string;
    teacher: Types.ObjectId | { _id: Types.ObjectId };
}

const courseSchema = new Schema<ICourse>(
    {
        title: { type: String, required: true, index: true },
        description: { type: String },
        joinCode: { type: String, required: true, unique: true, index: true },
        teacher: { type: Types.ObjectId, ref: "User", required: true, index: true },
    },
    { timestamps: true }
);

// Compound indexes for common queries
courseSchema.index({ teacher: 1, createdAt: -1 });
courseSchema.index({ title: "text", description: "text" });

export default model<ICourse>("Course", courseSchema);
