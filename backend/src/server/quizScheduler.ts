import cron from "node-cron";
import dayjs from "dayjs";
import Attempt from "../models/attempt.js";
import Quiz from "../models/quiz.js";
import Enrollment from "../models/enrollment.js";
import { gradeSubmittedAttempt } from "../controllers/attempt.controller.js";
import { notifyUser } from "./socket.js";

// Track processed quizzes to avoid duplicate notifications (in-memory, reset on server restart)
const notifiedQuizzes = new Set<string>();

export function startQuizScheduler() {
    cron.schedule("* * * * *", async () => {
        const now = dayjs();
        let processedCount = 0;
        let notifiedCount = 0;

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

        // ── Phase 2: Notify students when quiz closes (gradingMode="onClose") ──────────────
        const closedQuizzes = await Quiz.find({
            closeAt: { $lte: now.toDate() },
            gradingMode: "onClose",
            _id: { $nin: Array.from(notifiedQuizzes) },
        })
            .populate("course", "title")
            .lean();

        for (const quiz of closedQuizzes) {
            const quizId = quiz._id.toString();
            const courseTitle = (quiz.course as any)?.title || "a course";

            // Mark as notified
            notifiedQuizzes.add(quizId);

            // Get all graded attempts for this quiz
            const attempts = await Attempt.find({
                quiz: quizId,
                status: { $in: ["submitted", "late", "graded"] },
            })
                .populate("user", "name")
                .lean();

            // Get all enrolled students for this course
            const enrollments = await Enrollment.find({
                course: (quiz.course as any)?._id || quiz.course,
                status: "active",
            })
                .populate("user", "name")
                .lean();

            const attemptedUserIds = new Set(attempts.map((a) => a.user?._id?.toString()).filter(Boolean));

            // 1. Notify students who attempted
            for (const attempt of attempts) {
                const studentId = attempt.user?._id?.toString();
                if (!studentId) continue;

                const studentName = (attempt.user as any)?.name || "Student";
                const score = attempt.score || 0;
                const maxScore = attempt.maxScore || 100;
                const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

                console.log(
                    `[scheduler] Notifying ${studentName} about grades for "${quiz.title}" - ${score}/${maxScore} (${percentage}%)`,
                );

                notifyUser(studentId, "quiz-graded", {
                    quizId,
                    quizTitle: quiz.title,
                    courseTitle,
                    attemptId: attempt._id.toString(),
                    score,
                    maxScore,
                    percentage,
                });

                notifiedCount++;
            }

            // 2. Notify enrolled students who didn't attempt
            for (const enrollment of enrollments) {
                const studentId = enrollment.user?._id?.toString();
                if (!studentId || attemptedUserIds.has(studentId)) continue;

                const studentName = (enrollment.user as any)?.name || "Student";

                console.log(
                    `[scheduler] Notifying ${studentName} about missed quiz "${quiz.title}"`,
                );

                notifyUser(studentId, "quiz-missed", {
                    quizId,
                    quizTitle: quiz.title,
                    courseTitle,
                });

                notifiedCount++;
            }
        }

        if (notifiedCount > 0) {
            console.log(`[scheduler] Sent ${notifiedCount} quiz notification(s)`);
        }
    });

    console.log("Quiz scheduler started");
}