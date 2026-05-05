/**
 * Shared utilities for grading calculations
 */

/**
 * Calculate score percentage from raw score and responses
 * @param rawScore - The earned score
 * @param responses - Array of responses with question points
 * @returns Score as percentage (0-100)
 */
export function calculateScorePercentage(
    rawScore: number | undefined,
    responses: { question?: { points?: number } | null }[] | null | undefined
): number {
    if (!responses || !responses.length) return 0;
    
    const totalPossiblePoints = responses.reduce(
        (sum, r) => sum + (((r.question as any)?.points) || 1),
        0,
    );
    
    if (totalPossiblePoints <= 0 || rawScore === undefined) return 0;
    
    return Math.round((rawScore / totalPossiblePoints) * 100);
}

/**
 * Format grade result for API response
 */
export interface GradeResult {
    attemptId: unknown;
    quiz: {
        _id: unknown;
        title: string;
    };
    score: number;
    submittedAt: Date | null;
    status: string;
}

export function formatGradeResult(
    attempt: any,
    user?: any
): GradeResult {
    const scorePercentage = calculateScorePercentage(
        attempt.score,
        attempt.responses
    );
    
    return {
        attemptId: attempt._id,
        quiz: {
            _id: attempt.quiz?._id,
            title: (attempt.quiz as any)?.title || "Unknown Quiz",
        },
        score: scorePercentage,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
    };
}