import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useQuizStore from "../stores/Quizstore";
import useAuthStore from "../stores/Authstore";
import axios from "axios";
import {
    Home,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Trophy,
    TrendingUp,
    ArrowLeft,
} from "lucide-react";

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

    if (loading) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
                <div className="card bg-white shadow-lg border border-slate-200 max-w-md">
                    <div className="card-body text-center">
                        <p className="text-error text-lg mb-4">{error}</p>
                        <button
                            onClick={() => navigate("/student")}
                            className="btn btn-primary gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center px-6">
                <div className="card bg-white shadow-lg border border-slate-200">
                    <div className="card-body text-center">
                        <p className="text-gray-600 text-lg mb-4">
                            Results not found
                        </p>
                        <button
                            onClick={() => navigate("/student")}
                            className="btn btn-primary gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Calculate stats
    const rawScore = Number.isFinite(attempt.score)
        ? attempt.score
        : attempt.responses?.reduce(
              (sum, r) =>
                  sum +
                  (Number.isFinite(r.pointsAwarded) ? r.pointsAwarded : 0),
              0,
          );
    const totalPointsPossible = attempt.responses?.length || 0;
    const scorePercentage =
        totalPointsPossible > 0
            ? Math.round((rawScore / totalPointsPossible) * 100)
            : 0;

    const correctAnswers =
        attempt.responses?.filter((r) => r.pointsAwarded > 0).length || 0;
    const incorrectAnswers = (attempt.responses?.length || 0) - correctAnswers;

    // Determine performance level
    const getPerformanceData = (percentage) => {
        if (percentage >= 90) {
            return {
                label: "Outstanding",
                icon: Trophy,
                color: "text-emerald-600",
                bgColor: "bg-emerald-50",
                borderColor: "border-emerald-200",
                message: "🎉 Excellent work! Outstanding performance!",
            };
        } else if (percentage >= 80) {
            return {
                label: "Excellent",
                icon: Trophy,
                color: "text-green-600",
                bgColor: "bg-green-50",
                borderColor: "border-green-200",
                message: "🎉 Great job! You passed with flying colors!",
            };
        } else if (percentage >= 70) {
            return {
                label: "Good",
                icon: CheckCircle,
                color: "text-blue-600",
                bgColor: "bg-blue-50",
                borderColor: "border-blue-200",
                message: "👍 Good work! You passed the quiz.",
            };
        } else if (percentage >= 60) {
            return {
                label: "Satisfactory",
                icon: CheckCircle,
                color: "text-yellow-600",
                bgColor: "bg-yellow-50",
                borderColor: "border-yellow-200",
                message: "📊 You passed, but there's room for improvement.",
            };
        } else {
            return {
                label: "Needs Improvement",
                icon: XCircle,
                color: "text-red-600",
                bgColor: "bg-red-50",
                borderColor: "border-red-200",
                message: "📚 Keep practicing! You can improve.",
            };
        }
    };

    const performance = getPerformanceData(scorePercentage);
    const PerformanceIcon = performance.icon;

    const timeTaken = (() => {
        if (!attempt.submittedAt || (!attempt.startedAt && !attempt.startAt)) {
            return null;
        }

        const submittedTime = new Date(attempt.submittedAt).getTime();
        const startedTime = new Date(
            attempt.startedAt || attempt.startAt,
        ).getTime();
        const diffMinutes = Math.max(
            0,
            Math.round((submittedTime - startedTime) / 60000),
        );

        return diffMinutes;
    })();

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-8 px-6">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Main Results Card */}
                <div
                    className={`card shadow-2xl border-2 ${performance.borderColor} ${performance.bgColor}`}
                >
                    <div className="card-body text-center py-12">
                        {/* Performance Icon and Label */}
                        <div className="flex justify-center mb-6">
                            <div
                                className={`p-6 rounded-full ${performance.bgColor} border-2 ${performance.borderColor}`}
                            >
                                <PerformanceIcon
                                    className={`w-16 h-16 ${performance.color}`}
                                />
                            </div>
                        </div>

                        {/* Quiz Title */}
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            {attempt.quiz?.title || "Quiz Completed"}
                        </h1>
                        <p
                            className={`text-lg font-semibold ${performance.color}`}
                        >
                            {performance.label} Performance
                        </p>

                        {/* Score Display */}
                        <div className="my-8">
                            <div
                                className={`text-7xl font-black ${performance.color} mb-2`}
                            >
                                {scorePercentage}%
                            </div>
                            <div className="text-2xl font-semibold text-gray-800">
                                {totalPointsPossible > 0
                                    ? `Score: ${rawScore} / ${totalPointsPossible} points`
                                    : `Score: ${rawScore} points`}
                            </div>
                        </div>

                        {/* Performance Message */}
                        <div className="bg-white bg-opacity-60 rounded-lg p-4 mb-6">
                            <p
                                className={`text-lg font-semibold ${performance.color}`}
                            >
                                {performance.message}
                            </p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white bg-opacity-60 rounded-lg p-4">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <p className="text-3xl font-bold text-green-600">
                                    {correctAnswers}
                                </p>
                                <p className="text-sm text-gray-600">Correct</p>
                            </div>
                            <div className="bg-white bg-opacity-60 rounded-lg p-4">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <p className="text-3xl font-bold text-red-600">
                                    {incorrectAnswers}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Incorrect
                                </p>
                            </div>
                            <div className="bg-white bg-opacity-60 rounded-lg p-4">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Clock className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-3xl font-bold text-blue-600">
                                    {timeTaken !== null ? timeTaken : "--"}
                                </p>
                                <p className="text-sm text-gray-600">Minutes</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submission Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card bg-white shadow-lg border border-slate-200">
                        <div className="card-body">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold text-gray-600">
                                    Submitted
                                </span>
                            </div>
                            <p className="text-gray-900 font-medium">
                                {attempt.submittedAt
                                    ? new Date(
                                          attempt.submittedAt,
                                      ).toLocaleString()
                                    : "N/A"}
                            </p>
                        </div>
                    </div>
                    <div className="card bg-white shadow-lg border border-slate-200">
                        <div className="card-body">
                            <div className="flex items-center gap-3 mb-2">
                                <Clock className="w-5 h-5 text-purple-600" />
                                <span className="font-semibold text-gray-600">
                                    Time Taken
                                </span>
                            </div>
                            <p className="text-gray-900 font-medium">
                                {timeTaken !== null
                                    ? `${timeTaken} minute${timeTaken !== 1 ? "s" : ""}`
                                    : "Duration not available"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Answer Breakdown */}
                {attempt.responses && attempt.responses.length > 0 && (
                    <div className="card bg-white shadow-lg border border-slate-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-6 flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-blue-600" />
                                Answer Breakdown
                            </h2>
                            <div className="space-y-4">
                                {attempt.responses.map((response, index) => {
                                    const isCorrect =
                                        response.pointsAwarded > 0;
                                    return (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-lg border-l-4 transition-all ${
                                                isCorrect
                                                    ? "bg-green-50 border-l-green-500"
                                                    : "bg-red-50 border-l-red-500"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-900">
                                                            Question {index + 1}
                                                        </h3>
                                                        {isCorrect ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-600" />
                                                        )}
                                                    </div>
                                                    <p className="text-gray-700 leading-relaxed">
                                                        {response.prompt ||
                                                            "Question not available"}
                                                    </p>
                                                </div>
                                                <div className="text-right ml-4 shrink-0">
                                                    <div
                                                        className={`text-2xl font-bold ${
                                                            isCorrect
                                                                ? "text-green-600"
                                                                : "text-red-600"
                                                        }`}
                                                    >
                                                        {response.pointsAwarded}{" "}
                                                        / 1
                                                    </div>
                                                    <p
                                                        className={`text-xs font-semibold uppercase tracking-wider ${
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
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => navigate("/student")}
                        className="btn btn-primary btn-lg gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Back to Dashboard
                    </button>
                    <button
                        onClick={() => navigate("/student")}
                        className="btn btn-ghost btn-lg gap-2"
                    >
                        <TrendingUp className="w-5 h-5" />
                        View Other Quizzes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuizResultsPage;
