import { Server as SocketIOServer } from "socket.io";
import { Server as HttpServer } from "http";
import Notification from "../models/notification.js";
import type { NotificationType } from "../models/notification.js";

let io: SocketIOServer | null = null;

export const initSocket = (server: HttpServer) => {
    io = new SocketIOServer(server, {
        cors: {
            origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
            methods: ["GET", "POST"],
            credentials: true,
        },
    });
    return io;
};

export const getIO = (): SocketIOServer => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};

const saveNotification = async (userId: string, event: string, data: any) => {
    try {
        let type: NotificationType = "system";
        let title = "Notification";
        let message = "You have a new update";
        let link = "";

        if (event === "new-quiz") {
            type = "quiz";
            title = "New Quiz Released";
            message = `${data.title} is now available in ${data.courseTitle}`;
            link = `/student`; // Or more specific if added
        } else if (event === "new-note") {
            type = "note";
            title = "New Course Note";
            message = `A new note "${data.title}" has been posted.`;
            link = `/note/${data.noteId}`;
        } else if (event === "chat-message") {
            const senderName = typeof data.sender === 'object' ? data.sender.name : "Teammate";
            type = "chat";
            title = `Message from ${senderName}`;
            message = data.text;
            link = `/student`; // Links to dashboard where chat exists
        }

        await Notification.create({
            user: userId as any,
            type,
            title,
            message,
            link,
            read: false
        });
    } catch (err) {
        console.error("Failed to save persistent notification:", err);
    }
};

// Helper for notifying a specific user
export const notifyUser = (userId: string, event: string, data: any) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
        saveNotification(userId, event, data);
    }
};

// Helper for notifying multiple users (e.g. course enrollment)
export const notifyUsers = (userIds: string[], event: string, data: any) => {
    if (io) {
        userIds.forEach(id => {
            io!.to(`user:${id}`).emit(event, data);
            saveNotification(id, event, data);
        });
    }
};
