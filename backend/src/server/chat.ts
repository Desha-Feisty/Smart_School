import type { Server as HttpServer } from "http";
import { type Server as SocketIOServer, type Socket } from "socket.io";
import Jwt, { type JwtPayload } from "jsonwebtoken";
import Course from "../models/course.js";
import Enrollment from "../models/enrollment.js";
import ChatMessage from "../models/chat.js";

interface SocketUser {
    id: string;
    role: string;
}

function verifyToken(token: string): SocketUser {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET missing");
    }
    const payload = Jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    if (
        !payload ||
        typeof payload === "string" ||
        !payload._id ||
        !payload.role
    ) {
        throw new Error("invalid token");
    }
    return { id: payload._id.toString(), role: payload.role.toString() };
}

function getChatRoom(courseId: string, teacherId: string, studentId: string) {
    return `chat:${courseId}:${teacherId}:${studentId}`;
}

async function validateChatAccess({
    user,
    courseId,
    peerId,
}: {
    user: SocketUser;
    courseId: string;
    peerId: string;
}) {
    const course = await Course.findById(courseId);
    if (!course) {
        throw new Error("course not found");
    }

    const teacherId = course.teacher.toString();

    if (user.role === "teacher") {
        if (user.id !== teacherId) {
            throw new Error("forbidden");
        }
        const enrollment = await Enrollment.findOne({
            course: course._id,
            user: peerId,
            status: "active",
        });
        if (!enrollment) {
            throw new Error("student is not enrolled in this course");
        }
        return {
            room: getChatRoom(courseId, teacherId, peerId),
            peerId,
            teacherId,
            studentId: peerId,
        };
    }

    if (user.role === "student") {
        if (peerId !== teacherId) {
            throw new Error("invalid chat participant");
        }
        const enrollment = await Enrollment.findOne({
            course: course._id,
            user: user.id,
            status: "active",
        });
        if (!enrollment) {
            throw new Error("student is not enrolled in this course");
        }
        return {
            room: getChatRoom(courseId, teacherId, user.id),
            peerId,
            teacherId,
            studentId: user.id,
        };
    }

    throw new Error("forbidden");
}

export function initializeChat(io: SocketIOServer) {
    io.on("connection", (socket: Socket) => {
        const rawToken = socket.handshake.auth?.token;
        if (!rawToken || typeof rawToken !== "string") {
            socket.emit("socket-error", { message: "Authentication required" });
            socket.disconnect(true);
            return;
        }

        let user: SocketUser;
        try {
            user = verifyToken(rawToken);
            socket.data.user = user;
            // Join a private room for personal notifications
            socket.join(`user:${user.id}`);
            console.log(`User ${user.id} joined personal notification room`);
        } catch (error) {
            socket.emit("socket-error", {
                message:
                    error instanceof Error ? error.message : "Invalid token",
            });
            socket.disconnect(true);
            return;
        }

        socket.on("join-chat", async (payload) => {
            try {
                const { courseId, peerId } = payload || {};
                if (!courseId || !peerId) {
                    throw new Error("courseId and peerId are required");
                }
                const { room } = await validateChatAccess({
                    user,
                    courseId,
                    peerId,
                });
                socket.join(room);

                const messages = await ChatMessage.find({
                    course: courseId,
                    $or: [
                        { sender: user.id, recipient: peerId },
                        { sender: peerId, recipient: user.id },
                    ],
                })
                    .sort({ createdAt: 1 })
                    .populate("sender", "name role")
                    .populate("recipient", "name role")
                    .lean();

                socket.emit("chat-history", {
                    room,
                    messages: messages.map((message) => {
                        const sender = (message.sender as any)?._id
                            ? (message.sender as any)._id.toString()
                            : message.sender;
                        const recipient = (message.recipient as any)?._id
                            ? (message.recipient as any)._id.toString()
                            : message.recipient;
                        return {
                            ...message,
                            sender,
                            recipient,
                        };
                    }),
                });
            } catch (error) {
                socket.emit("socket-error", {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unable to join chat",
                });
            }
        });

        socket.on("send-chat-message", async (payload) => {
            try {
                const { courseId, recipientId, text } = payload || {};
                if (!courseId || !recipientId || !text) {
                    throw new Error(
                        "courseId, recipientId and text are required",
                    );
                }
                const { room, teacherId } = await validateChatAccess({
                    user,
                    courseId,
                    peerId: recipientId,
                });

                if (user.role === "student" && recipientId !== teacherId) {
                    throw new Error("Invalid recipient");
                }

                const message = await ChatMessage.create({
                    course: courseId,
                    sender: user.id,
                    recipient: recipientId,
                    senderRole: user.role,
                    text,
                });

                await message.populate("sender", "name role");
                await message.populate("recipient", "name role");

                const messageObj = message.toObject();
                const sender = (message.sender as any)?._id
                    ? (message.sender as any)._id.toString()
                    : message.sender;
                const recipient = (message.recipient as any)?._id
                    ? (message.recipient as any)._id.toString()
                    : message.recipient;

                const outMessage = {
                    ...messageObj,
                    sender: messageObj.sender, // Full object with name/role
                    recipient,
                };

                io.to(room).emit("chat-message", outMessage);

                // Send individual notification for persistence and global alerts
                const { notifyUser } = await import("./socket.js");
                notifyUser(recipientId, "chat-message", outMessage);
            } catch (error) {
                socket.emit("socket-error", {
                    message:
                        error instanceof Error
                            ? error.message
                            : "Unable to send message",
                });
            }
        });
    });
}
