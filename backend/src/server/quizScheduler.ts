import cron from "node-cron";
import dayjs from "dayjs";
import Attempt from "../models/attempt.js";
import { gradeSubmittedAttempt } from "../controllers/attempt.controller.js";

export function startQuizScheduler() {
    cron.schedule("* * * * *", async () => {
        const now = dayjs();
        let processedCount = 0;

        // ── Phase 1: Auto-submit expired in-progress attempts ──────────────
        // Only queries attempts that actually need work (naturally idempotent)
        const expiredAttempts = await Attempt.find({
            status: "inProgress",
            endAt: { $lte: now.toDate() },
        }).populate("quiz");

        for (const attempt of expiredAttempts) {
            const quiz = attempt.quiz as any;
            if (!quiz) continue;

            const wasLate = now.isAfter(dayjs(attempt.endAt));
            console.log(
                `[scheduler] Auto-submitting attempt ${attempt._id} (${wasLate ? "late" : "on time"})`,
            );

            attempt.status = wasLate ? "late" : "submitted";
            attempt.submittedAt = now.toDate();
            await attempt.save();

            // Grade immediately (teacher sees grades now, students see after quiz closes)
            console.log(`[scheduler] Grading attempt ${attempt._id}`);
            await gradeSubmittedAttempt(attempt, wasLate);

            processedCount++;
        }

        if (processedCount > 0) {
            console.log(`[scheduler] Processed ${processedCount} attempt(s)`);
        }
    });

    console.log("Quiz scheduler started");
}