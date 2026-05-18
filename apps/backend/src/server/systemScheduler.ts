import cron from "node-cron";
import { cleanOldLogs } from "../services/logger.js";

export function startSystemScheduler() {
    cron.schedule("0 2 * * *", async () => {
        console.log("[SYSTEM] Running daily maintenance tasks...");
        const deleted = await cleanOldLogs();
        console.log(`[SYSTEM] Log cleanup complete. Removed ${deleted} old entries.`);
    });

    console.log("System scheduler started (log cleanup runs daily at 2 AM)");
}