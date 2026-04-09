import { Schema, model, Types, Document } from "mongoose";

export interface IEditHistory {
    content: string;
    editedAt: Date;
}

export interface INote extends Document {
    course: Types.ObjectId;
    teacher: Types.ObjectId;
    title: string;
    content: string;
    editHistory: IEditHistory[];
    createdAt: Date;
    updatedAt: Date;
}

const editHistorySchema = new Schema<IEditHistory>({
    content: { type: String, required: true },
    editedAt: { type: Date, required: true },
});

const noteSchema = new Schema<INote>(
    {
        course: {
            type: Types.ObjectId,
            ref: "Course",
            required: true,
        },
        teacher: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: { type: String, required: true },
        content: { type: String, required: true },
        editHistory: [editHistorySchema],
    },
    { timestamps: true },
);

noteSchema.index({ course: 1, createdAt: -1 });

export default model<INote>("Note", noteSchema);
