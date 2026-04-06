import { Schema, Types, model } from "mongoose";

export interface ICourse {
    title: string;
    description?: string;
    joinCode: string;
    teacher: Types.ObjectId | { _id: Types.ObjectId };
}

const courseSchema = new Schema<ICourse>(
    {
        title: { type: String, required: true },
        description: { type: String },
        joinCode: { type: String, required: true, unique: true },
        teacher: { type: Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

export default model<ICourse>("Course", courseSchema);
