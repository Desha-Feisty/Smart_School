import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useQuizStore from "../stores/Quizstore";
import useAuthStore from "../stores/Authstore";
import axios from "axios";

function QuizResultsPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const { currentAttempt } = useQuizStore();
    const { token } = useAuthStore();
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                const response = await axios.get(`/api/attempts/${attemptId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const attemptData = {
                    ...response.data.attempt,
                    quiz: response.data.quiz,
                    course: response.data.course,
                    responses: response.data.responses,
                };
                setAttempt(attemptData);
            } catch (err) {
                console.error("Failed to fetch attempt:", err);
                if (currentAttempt?._id === attemptId) {
                    setAttempt(currentAttempt);
                } else {
                    setError(
                        err.response?.data?.errMsg || "Failed to load results",
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchAttempt();
    }, [attemptId, currentAttempt, token]);

    const handleBackToDashboard = () => {
        navigate("/student");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <p className="text-gray-600 text-lg mb-4">
                        Loading results...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
                    <p className="text-red-600 text-lg mb-4">{error}</p>
                    <button
                        onClick={handleBackToDashboard}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                    <p className="text-gray-600 text-lg mb-4">
                        Results not found
                    </p>
                    <button
                        onClick={handleBackToDashboard}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Calculate total points possible
    // Since backend doesn't return total points, we assume 1 point per question
    const totalPointsPossible = attempt.responses?.length || 0;
    const scorePercentage =
        totalPointsPossible > 0
            ? Math.round((attempt.score / totalPointsPossible) * 100)
            : 0;

    // Determine performance color
    const getPerformanceColor = (percentage) => {
        if (percentage >= 80) return "text-green-600";
        if (percentage >= 60) return "text-yellow-600";
        return "text-red-600";
    };

    const getPerformanceBg = (percentage) => {
        if (percentage >= 80) return "bg-green-50 border-green-200";
        if (percentage >= 60) return "bg-yellow-50 border-yellow-200";
        return "bg-red-50 border-red-200";
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto px-6">
                {/* Results Card */}
                <div
                    className={`bg-white rounded-lg border-2 shadow-lg p-8 mb-8 ${getPerformanceBg(scorePercentage)}`}
                >
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {attempt.quiz?.title || "Quiz"}
                        </h1>
                        <p className="text-gray-600">
                            Quiz completed successfully!
                        </p>
                    </div>

                    {/* Score Display */}
                    <div className="text-center mb-8">
                        <div
                            className={`text-6xl font-bold ${getPerformanceColor(scorePercentage)} mb-2`}
                        >
                            {scorePercentage}%
                        </div>
                        <div className="text-2xl font-semibold text-gray-800">
                            Score: {attempt.score} / {totalPointsPossible}
                        </div>
                    </div>

                    {/* Performance Message */}
                    <div className="text-center mb-8 p-4 bg-white rounded-lg">
                        {scorePercentage >= 80 && (
                            <p className="text-lg text-green-700 font-semibold">
                                🎉 Excellent work! You passed with flying
                                colors!
                            </p>
                        )}
                        {scorePercentage >= 60 && scorePercentage < 80 && (
                            <p className="text-lg text-yellow-700 font-semibold">
                                👍 Good job! You passed the quiz.
                            </p>
                        )}
                        {scorePercentage < 60 && (
                            <p className="text-lg text-red-700 font-semibold">
                                📚 Keep practicing! You can improve.
                            </p>
                        )}
                    </div>

                    {/* Submission Details */}
                    <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-white rounded-lg">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">
                                Submitted At
                            </p>
                            <p className="text-sm text-gray-900 font-semibold mt-1">
                                {attempt.submittedAt
                                    ? new Date(
                                          attempt.submittedAt,
                                      ).toLocaleString()
                                    : "N/A"}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold">
                                Duration
                            </p>
                            <p className="text-sm text-gray-900 font-semibold mt-1">
                                {attempt.submittedAt &&
                                (attempt.startedAt || attempt.startAt)
                                    ? Math.round(
                                          (new Date(attempt.submittedAt) -
                                              new Date(
                                                  attempt.startedAt ||
                                                      attempt.startAt,
                                              )) /
                                              60000,
                                      )
                                    : "N/A"}{" "}
                                min
                            </p>
                        </div>
                    </div>
                </div>

                {/* Answer Breakdown */}
                {attempt.responses && attempt.responses.length > 0 && (
                    <div className="bg-white rounded-lg border shadow-lg p-8 mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Answer Breakdown
                        </h2>
                        <div className="space-y-4">
                            {attempt.responses.map((response, index) => {
                                const isCorrect = response.pointsAwarded > 0;
                                return (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border-l-4 ${
                                            isCorrect
                                                ? "bg-green-50 border-l-green-500"
                                                : "bg-red-50 border-l-red-500"
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">
                                                    Question {index + 1}
                                                </h3>
                                                <p className="text-gray-700 mb-2">
                                                    {response.prompt ||
                                                        "Question not available"}
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <span
                                                    className={`font-bold text-lg ${
                                                        isCorrect
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {response.pointsAwarded} / 1
                                                </span>
                                                <p
                                                    className={`text-xs font-semibold ${
                                                        isCorrect
                                                            ? "text-green-600"
                                                            : "text-red-600"
                                                    }`}
                                                >
                                                    {isCorrect
                                                        ? "✓ Correct"
                                                        : "✗ Incorrect"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={handleBackToDashboard}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/student")}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg"
                    >
                        View Other Quizzes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuizResultsPage;
