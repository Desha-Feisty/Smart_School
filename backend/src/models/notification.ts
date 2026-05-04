import { Schema, model, Types, Document } from "mongoose";

export type NotificationType = "quiz" | "quiz-graded" | "quiz-missed" | "note" | "chat" | "system";

export interface INotification {
    user: Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    read: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: { 
            type: String, 
            enum: ["quiz", "quiz-graded", "quiz-missed", "note", "chat", "system"], 
            required: true 
        },
        link: { type: String },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default model<INotification>("Notification", notificationSchema);
