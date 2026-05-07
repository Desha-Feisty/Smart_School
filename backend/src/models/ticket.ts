import { Schema, model } from "mongoose";

export type TicketStatus = "open" | "closed";

export interface ITicket {
    user: Schema.Types.ObjectId;
    subject: string;
    message: string;
    status: TicketStatus;
    adminReply?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
    {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        subject: { type: String, required: true, trim: true, maxlength: 200 },
        message: { type: String, required: true, trim: true },
        status: { type: String, enum: ["open", "closed"], default: "open" },
        adminReply: { type: String, trim: true },
    },
    { timestamps: true }
);

ticketSchema.index({ user: 1, createdAt: -1 });
ticketSchema.index({ status: 1 });

export default model<ITicket>("Ticket", ticketSchema);