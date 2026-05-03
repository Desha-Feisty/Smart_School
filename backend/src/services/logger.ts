import ActivityLog, { type LogAction } from "../models/activityLog.js";
import { Types } from "mongoose";

interface LogEntry {
    userId?: string;
    action: LogAction;
    details: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}

const LOG_RETENTION_DAYS = 30;

export async function logActivity(entry: LogEntry): Promise<void> {
    try {
        const logData: Record<string, unknown> = {
            action: entry.action,
            details: entry.details,
        };
        
        if (entry.userId) {
            logData.user = new Types.ObjectId(entry.userId);
        }
        if (entry.metadata) {
            logData.metadata = entry.metadata;
        }
        if (entry.ipAddress) {
            logData.ipAddress = entry.ipAddress;
        }
        if (entry.userAgent) {
            logData.userAgent = entry.userAgent;
        }
        
        await ActivityLog.create(logData);
        console.log(`[LOG] ${entry.action}: ${entry.details}`);
    } catch (err) {
        console.error("Failed to log activity:", err);
    }
}

export async function cleanOldLogs(): Promise<number> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - LOG_RETENTION_DAYS);
        
        const result = await ActivityLog.deleteMany({
            createdAt: { $lt: cutoffDate },
        });
        
        console.log(`[LOG] Cleaned up ${result.deletedCount} old log entries`);
        return result.deletedCount;
    } catch (err) {
        console.error("Failed to clean old logs:", err);
        return 0;
    }
}

export async function getLogs(options: {
    action?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
}) {
    const filter: Record<string, unknown> = {};
    
    if (options.action) {
        filter.action = options.action;
    }
    if (options.userId) {
        filter.user = new Types.ObjectId(options.userId);
    }
    if (options.startDate || options.endDate) {
        filter.createdAt = {};
        if (options.startDate) {
            (filter.createdAt as Record<string, Date>).$gte = options.startDate;
        }
        if (options.endDate) {
            (filter.createdAt as Record<string, Date>).$lte = options.endDate;
        }
    }

    const [logs, total] = await Promise.all([
        ActivityLog.find(filter)
            .populate("user", "name email role")
            .sort({ createdAt: -1 })
            .skip(options.skip || 0)
            .limit(options.limit || 50)
            .lean(),
        ActivityLog.countDocuments(filter),
    ]);

    return { logs, total };
}

export async function getLogStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const actionCounts = await ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]);

    const dailyCounts = await ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    const totalLogs = await ActivityLog.countDocuments({ createdAt: { $gte: startDate } });
    
    const userActivity = await ActivityLog.aggregate([
        { $match: { createdAt: { $gte: startDate }, user: { $exists: true } } },
        { $group: { _id: "$user", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userInfo",
            },
        },
        { $unwind: "$userInfo" },
        {
            $project: {
                userId: "$_id",
                name: "$userInfo.name",
                count: 1,
            },
        },
    ]);

    return {
        actionCounts: actionCounts.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
        }, {} as Record<string, number>),
        dailyCounts,
        totalLogs,
        userActivity,
    };
}

export async function exportLogsToCsv(startDate: Date, endDate: Date): Promise<string> {
    const logs = await ActivityLog.find({
        createdAt: { $gte: startDate, $lte: endDate },
    })
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .lean();

    const headers = ["Timestamp", "User", "Email", "Action", "Details", "IP Address"];
    const rows = logs.map((log) => [
        new Date(log.createdAt).toISOString(),
        log.user ? (log.user as unknown as { name: string }).name : "System",
        log.user ? (log.user as unknown as { email: string }).email : "-",
        log.action,
        log.details.replace(/,/g, ";"),
        log.ipAddress || "-",
    ]);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}