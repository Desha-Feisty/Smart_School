import { Schema, model, Types, Document } from "mongoose";

export interface IComment extends Document {
    note: Types.ObjectId;
    user: Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
    {
        note: {
            type: Types.ObjectId,
            ref: "Note",
            required: true,
        },
        user: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: { type: String, required: true },
    },
    { timestamps: true },
);

commentSchema.index({ note: 1, createdAt: -1 });

export default model<IComment>("Comment", commentSchema);
