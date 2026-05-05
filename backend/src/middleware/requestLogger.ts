import type { Request, Response, NextFunction } from "express";

interface RequestLog {
    method: string;
    url: string;
    status: number;
    duration: number;
    ip: string;
    userAgent: string;
    timestamp: Date;
    userId?: string;
}

const requestLogs: RequestLog[] = [];
const MAX_LOGS = 1000;

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Capture response finish event
    res.on("finish", () => {
        const duration = Date.now() - startTime;
        const log: RequestLog = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration,
            ip: req.ip || req.socket.remoteAddress || "unknown",
            userAgent: req.get("User-Agent") || "unknown",
            timestamp: new Date(),
            userId: (req as any).user?._id,
        };

        // Add to logs array
        requestLogs.push(log);

        // Keep only last MAX_LOGS
        if (requestLogs.length > MAX_LOGS) {
            requestLogs.shift();
        }

        // Log slow requests (> 1s)
        if (duration > 1000) {
            console.warn(`[SLOW] ${req.method} ${req.originalUrl} - ${duration}ms`);
        }

        // Log errors (4xx, 5xx)
        if (res.statusCode >= 400) {
            console.log(`[${res.statusCode}] ${req.method} ${req.originalUrl} - ${duration}ms`);
        }
    });

    next();
};

// Get recent logs
export const getRequestLogs = (filters?: {
    method?: string;
    status?: number;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
}): RequestLog[] => {
    let filtered = [...requestLogs];

    if (filters?.method) {
        filtered = filtered.filter((log) => log.method === filters.method);
    }
    if (filters?.status) {
        filtered = filtered.filter((log) => log.status === filters.status);
    }
    if (filters?.userId) {
        filtered = filtered.filter((log) => log.userId === filters.userId);
    }
    if (filters?.startDate) {
        filtered = filtered.filter((log) => log.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
        filtered = filtered.filter((log) => log.timestamp <= filters.endDate!);
    }

    return filtered;
};

// Get statistics
export const getRequestStats = () => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    const recentLogs = requestLogs.filter((log) => log.timestamp >= last24h);
    const hourlyLogs = requestLogs.filter((log) => log.timestamp >= lastHour);

    const totalRequests = recentLogs.length;
    const avgDuration = recentLogs.reduce((sum, log) => sum + log.duration, 0) / (totalRequests || 1);

    const statusCounts = recentLogs.reduce((acc, log) => {
        const category = Math.floor(log.status / 100) + "xx";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const slowRequests = recentLogs.filter((log) => log.duration > 1000).length;
    const errorRequests = recentLogs.filter((log) => log.status >= 400).length;

    return {
        totalRequests,
        avgResponseTime: Math.round(avgDuration),
        requestsPerHour: hourlyLogs.length,
        statusCounts,
        slowRequests,
        errorRequests,
        errorRate: totalRequests > 0 ? ((errorRequests / totalRequests) * 100).toFixed(2) : "0",
    };
};

// Clear logs
export const clearRequestLogs = (): void => {
    requestLogs.length = 0;
};

export default requestLogger;