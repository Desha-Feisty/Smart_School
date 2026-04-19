import type { Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import Notification from "../models/notification.js";

const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const notifications = await Notification.find({ user: userId as any })
            .sort({ createdAt: -1 })
            .limit(20);

        const unreadCount = await Notification.countDocuments({
            user: userId as any,
            read: false
        });

        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error("Get notifications error:", err);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
};

const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;
        
        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: userId as any },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Mark read error:", err);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
};

const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        await Notification.updateMany(
            { user: userId as any, read: false },
            { read: true }
        );

        res.json({ success: true });
    } catch (err) {
        console.error("Mark all read error:", err);
        res.status(500).json({ error: "Failed to mark all as read" });
    }
};

export { getNotifications, markAsRead, markAllAsRead };
