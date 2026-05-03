import cron from "node-cron";
import dayjs from "dayjs";
import Quiz from "../models/quiz.js";
import Attempt from "../models/attempt.js";
import { gradeSubmittedAttempt } from "../controllers/attempt.controller.js";

export function startQuizScheduler() {
    cron.schedule("* * * * *", async () => {
        console.log("Running quiz scheduler check...");
        const now = dayjs();

        const closedQuizzes = await Quiz.find({
            closeAt: { $lte: now.toDate() },
            published: true,
        }).lean();

        for (const quiz of closedQuizzes) {
            const inProgressAttempts = await Attempt.find({
                quiz: quiz._id,
                status: "inProgress",
            });

            for (const attempt of inProgressAttempts) {
                console.log(`Auto-submitting in-progress attempt: ${attempt._id}`);
                const wasLate = now.isAfter(dayjs(attempt.endAt));
                attempt.status = "submitted";
                attempt.submittedAt = now.toDate();
                await attempt.save();

                if (quiz.gradingMode === "onClose") {
                    await gradeSubmittedAttempt(attempt);
                }
            }

            if (quiz.gradingMode === "onClose") {
                const submittedAttempts = await Attempt.find({
                    quiz: quiz._id,
                    status: "submitted",
                });

                for (const attempt of submittedAttempts) {
                    console.log(`Grading submitted attempt: ${attempt._id}`);
                    await gradeSubmittedAttempt(attempt);
                }
            }
        }
    });

    console.log("Quiz scheduler started");
}