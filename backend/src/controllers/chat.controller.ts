import type { Response } from "express";
import ChatMessage from "../models/chat.js";
import type { AuthRequest } from "../types/authRequest.js";

export const getRecentChats = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ errMsg: "unauthenticated" });
        }

        const userId = req.user.id;

        // Find all messages involving the user
        const messages = await ChatMessage.find({
            $or: [{ sender: userId }, { recipient: userId }],
        })
            .sort({ createdAt: -1 })
            .populate("course", "title")
            .populate("sender", "name role")
            .populate("recipient", "name role")
            .lean();

        // Group by unique conversation (courseId + peerId)
        const recentChatsMap = new Map();

        messages.forEach((msg) => {
            const isSender =
                msg.sender && (msg.sender as any)._id?.toString() === userId;
            const peer = isSender ? msg.recipient : msg.sender;

            if (!peer || !msg.course) return;

            const peerId = (peer as any)._id?.toString() || peer.toString();
            const courseId =
                (msg.course as any)._id?.toString() || msg.course.toString();

            const key = `${courseId}_${peerId}`;

            if (!recentChatsMap.has(key)) {
                recentChatsMap.set(key, { ...msg, peer });
            }
        });

        const recentChats = Array.from(recentChatsMap.values());
        res.status(200).json({ results: recentChats });
    } catch (error) {
        console.error("Error fetching recent chats:", error);
        res.status(500).json({ errMsg: "Failed to fetch recent chats" });
    }
};
