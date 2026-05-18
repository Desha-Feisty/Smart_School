import { Schema, model } from "mongoose";

export type CalendarEventType = "deadline" | "meeting" | "announcement" | "custom";

export interface ICalendarEvent {
    course: Schema.Types.ObjectId;
    title: string;
    description?: string;
    startAt: Date;
    endAt?: Date;
    eventType: CalendarEventType;
    createdBy: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const calendarEventSchema = new Schema<ICalendarEvent>(
    {
        course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        description: { type: String, trim: true },
        startAt: { type: Date, required: true, index: true },
        endAt: { type: Date },
        eventType: { 
            type: String, 
            enum: ["deadline", "meeting", "announcement", "custom"], 
            default: "custom" 
        },
        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

// Compound indexes
calendarEventSchema.index({ course: 1, startAt: 1 });
calendarEventSchema.index({ course: 1, createdAt: -1 });

export default model<ICalendarEvent>("CalendarEvent", calendarEventSchema);