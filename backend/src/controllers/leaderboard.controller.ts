import type { Response } from "express";
import type { AuthRequest } from "../types/authRequest.js";
import Attempt from "../models/attempt.js";
import Quiz from "../models/quiz.js";
import Enrollment from "../models/enrollment.js";
import { Types } from "mongoose";

const getCourseLeaderboard = async (req: AuthRequest, res: Response) => {
    try {
        const { courseId } = req.params;
        
        if (!courseId || !Types.ObjectId.isValid(courseId)) {
            return res.status(400).json({ error: "Invalid course ID format" });
        }

        const courseObjectId = new Types.ObjectId(courseId);

        // Check if course exists
        const enrollmentCheck = await Enrollment.findOne({ course: courseObjectId });
        if (!enrollmentCheck) {
            return res.json({ leaderboard: [] });
        }

        const quizzes = await Quiz.find({ course: courseObjectId }).select("_id");
        console.log(`Found ${quizzes.length} quizzes for course: ${courseId}`);
        const quizIds = quizzes.map(q => q._id);

        if (quizIds.length === 0) {
            console.log("No quizzes found, returning empty leaderboard");
            return res.json({ leaderboard: [] });
        }

        // Aggregate total score and possible points per user for these quizzes
        const aggregationResults = await Attempt.aggregate([
            {
                $match: {
                    quiz: { $in: quizIds },
                    status: { $in: ["graded", "late"] }
                }
            },
            {
                $group: {
                    _id: "$user",
                    totalScore: { $sum: "$score" },
                    totalPossible: { $sum: { $size: "$responses" } },
                    quizzesAttempted: { $sum: 1 }
                }
            },
            {
                $addFields: {
                    averageScore: {
                        $cond: [
                            { $gt: ["$totalPossible", 0] },
                            { $multiply: [{ $divide: ["$totalScore", "$totalPossible"] }, 100] },
                            0
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            { $unwind: "$userInfo" },
            {
                $project: {
                    fullName: "$userInfo.name",
                    totalScore: 1,
                    averageScore: 1,
                    quizzesAttempted: 1
                }
            },
            { $sort: { averageScore: -1, totalScore: -1 } }
        ]);

        const leaderboard = aggregationResults.map(r => ({
            ...r,
            averageScore: Math.round(r.averageScore)
        }));

        return res.json({ leaderboard });
    } catch (err) {
        console.error("Leaderboard error:", err);
        return res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
};

export { getCourseLeaderboard };
