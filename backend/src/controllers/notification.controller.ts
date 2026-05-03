import type { Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import Notification from "../models/notification.js";
import { Types } from "mongoose";

const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const notifications = await Notification.find({ user: userId as any })
            .sort({ createdAt: -1 })
            .limit(20);

        const unreadCount = await Notification.countDocuments({
            user: userId as any,
            read: false
        });

        return res.json({ notifications, unreadCount });
    } catch (err) {
        console.error("Get notifications error:", err);
        return res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;

        console.log(`Mark notification read: userId=${userId}, notificationId=${id}`);

        if (!userId || !id) {
            return res.status(400).json({ error: "Missing user ID or notification ID" });
        }

        const notification = await Notification.findOneAndUpdate(
            { _id: new Types.ObjectId(id), user: new Types.ObjectId(userId) },
            { read: true },
            { new: true }
        );

        if (!notification) {
            console.log(`Notification not found: id=${id}, user=${userId}`);
            return res.status(404).json({ error: "Notification not found" });
        }

        console.log(`Notification ${id} marked as read`);
        return res.json({ success: true, notification });
    } catch (err) {
        console.error("Mark read error:", err);
        return res.status(500).json({ error: "Failed to mark notification as read" });
    }
};

const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const result = await Notification.updateMany(
            { user: new Types.ObjectId(userId), read: false },
            { read: true }
        );

        console.log(`Marked ${result.modifiedCount} notifications as read for user ${userId}`);
        return res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err) {
        console.error("Mark all read error:", err);
        return res.status(500).json({ error: "Failed to mark all as read" });
    }
};

export { getNotifications, markAsRead, markAllAsRead };
