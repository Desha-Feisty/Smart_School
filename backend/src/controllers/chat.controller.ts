import type { Response } from "express";
import ChatMessage from "../models/chat.js";
import type { AuthRequest } from "../types/authRequest.js";

export const getRecentChatsV1 = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ errMsg: "unauthenticated" });
        }

        const userId = req.user._id;

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

        messages.forEach((msg: any) => {
            // Add normalized identifiers
            msg.senderId = msg.sender?._id?.toString() || msg.sender?.toString();
            msg.recipientId = msg.recipient?._id?.toString() || msg.recipient?.toString();

            const isSender =
                msg.sender && (msg.sender as any)._id?.toString() === userId;
            const peer = isSender ? msg.recipient : msg.sender;

            if (!peer || !msg.course) return;

            const peerId = (peer as any)._id?.toString() || peer.toString();
            const courseId =
                (msg.course as any)._id?.toString() || msg.course.toString();

            const key = `${courseId}_${peerId}`;

            if (!recentChatsMap.has(key)) {
                recentChatsMap.set(key, {
                    lastMessage: msg,
                    peer,
                    course: msg.course,
                    peerId,
                    courseId,
                });
            }
        });

        const recentChats = Array.from(recentChatsMap.values()).map(
            ({ lastMessage, peer, course, peerId, courseId }) => ({
                _id: `${courseId}_${peerId}`,
                peer,
                course,
                text: lastMessage.text,
                createdAt: lastMessage.createdAt,
                sender: lastMessage.sender,
                peerId,
                courseId,
                isMine:
                    lastMessage.sender &&
                    (lastMessage.sender._id?.toString() ||
                        lastMessage.sender?.toString()) === userId,
            }),
        );
        res.status(200).json({ results: recentChats });
    } catch (error) {
        console.error("Error fetching recent chats V1:", error);
        res.status(500).json({ errMsg: "Failed to fetch recent chats" });
    }
};

export const getRecentChatsV2 = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ errMsg: "unauthenticated" });
        }

        const userId = req.user._id;

        // Find latest messages involving the user
        const messages = await ChatMessage.find({
            $or: [{ sender: userId }, { recipient: userId }],
        })
            .sort({ createdAt: -1 })
            .select("text createdAt course sender recipient")
            .populate("course", "title")
            .populate("sender", "name role")
            .populate("recipient", "name role")
            .lean();

        // Group by unique conversation (courseId + peerId)
        // Now returns explicit metadata alongside the message history
        const recentChatsMap: Record<
            string,
            { peer: any; course: any; messages: any[]; peerId: string; courseId: string }
        > = {};

        messages.forEach((msg: any) => {
            // Add normalized identifiers
            msg.senderId = msg.sender?._id?.toString() || msg.sender?.toString();
            msg.recipientId = msg.recipient?._id?.toString() || msg.recipient?.toString();

            const isSender =
                msg.sender && (msg.sender as any)._id?.toString() === userId;
            const peer = isSender ? msg.recipient : msg.sender;

            if (!peer || !msg.course) return;

            const peerId = (peer as any)._id?.toString() || peer.toString();
            const courseId =
                (msg.course as any)._id?.toString() || msg.course.toString();

            const key = `${courseId}_${peerId}`;

            if (!recentChatsMap[key]) {
                recentChatsMap[key] = {
                    peer,
                    course: msg.course,
                    messages: [msg],
                    peerId,
                    courseId,
                };
            } else {
                recentChatsMap[key].messages.push(msg);
            }
        });

        res.status(200).json(recentChatsMap);
    } catch (error) {
        console.error("Error fetching recent chats V2:", error);
        res.status(500).json({ errMsg: "Failed to fetch recent chats" });
    }
};

// Default export points to V1 for backward compatibility
export const getRecentChats = getRecentChatsV1;
