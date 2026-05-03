import cron from "node-cron";
import dayjs from "dayjs";
import Quiz from "../models/quiz.js";
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

            // Grade immediately for onSubmit mode
            if (quiz.gradingMode === "onSubmit") {
                console.log(`[scheduler] Grading attempt ${attempt._id}`);
                await gradeSubmittedAttempt(attempt, wasLate);
            }

            processedCount++;
        }

        // ── Phase 2: Grade ungraded attempts for closed onClose quizzes ────
        // Only fetch attempts with submitted/late status (graded attempts excluded)
        // Also limit to quizzes that have closed to avoid scanning open quizzes
        const ungradedAttempts = await Attempt.find({
            status: { $in: ["submitted", "late"] },
            quiz: { $in: await Quiz.find({ closeAt: { $lte: now.toDate() } }).distinct("_id") },
        }).populate("quiz");

        for (const attempt of ungradedAttempts) {
            const quiz = attempt.quiz as any;
            if (!quiz) continue;

            // Only grade if the quiz has actually closed
            if (dayjs(quiz.closeAt).isAfter(now)) continue;
            if (quiz.gradingMode !== "onClose") continue;

            // Attempt status is already "submitted" or "late" at this point
            // gradeSubmittedAttempt will transition it to "graded"
            const wasLate = attempt.status === "late";
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