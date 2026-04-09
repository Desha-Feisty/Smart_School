import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useQuizStore from "../stores/Quizstore";
import toast from "react-hot-toast";
import {
    ChevronLeft,
    ChevronRight,
    Send,
    CheckCircle,
    Clock,
    AlertTriangle,
    Save,
    AlertCircle,
} from "lucide-react";

function StudentQuizPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const {
        currentAttempt,
        attemptQuestions,
        submitAnswer,
        submitAttempt,
        attemptError,
    } = useQuizStore();

    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [showWarning, setShowWarning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savingIndices, setSavingIndices] = useState(new Set());

    const [selectedQuestion, setSelectedQuestion] = useState(() =>
        attemptQuestions.length > 0 ? attemptQuestions[0] : null,
    );

    const handleAutoSubmit = useCallback(async () => {
        setIsSubmitting(true);
        const result = await submitAttempt(attemptId);
        if (result) {
            toast.success("Quiz submitted successfully!");
            navigate(`/student/quiz/${attemptId}/results`);
        } else {
            toast.error("Failed to submit quiz. Please try again.");
        }
    }, [attemptId, submitAttempt, navigate]);

    useEffect(() => {
        if (!currentAttempt?.endAt) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const endTime = new Date(currentAttempt.endAt).getTime();
            const remaining = Math.max(0, endTime - now);
            const remainingSeconds = Math.floor(remaining / 1000);

            setTimeRemaining(remainingSeconds);

            if (
                remainingSeconds <= 300 &&
                remainingSeconds > 0 &&
                !showWarning
            ) {
                setShowWarning(true);
                toast.error("⏰ Only 5 minutes remaining!");
            }

            if (remainingSeconds <= 0) {
                handleAutoSubmit();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [currentAttempt?.endAt, showWarning, handleAutoSubmit]);

    const handleAnswerChange = useCallback(
        async (questionId, choiceId) => {
            setAnswers((prev) => {
                return {
                    ...prev,
                    [questionId]: [choiceId],
                };
            });

            setSavingIndices((prev) => new Set(prev).add(questionId));

            const timeoutId = setTimeout(async () => {
                const success = await submitAnswer(attemptId, questionId, [
                    choiceId,
                ]);
                if (success) {
                    toast.success("Answer saved");
                }
                setSavingIndices((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(questionId);
                    return newSet;
                });
            }, 500);

            return () => clearTimeout(timeoutId);
        },
        [attemptId, submitAnswer],
    );

    const formatTime = (seconds) => {
        if (seconds === null) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const allQuestionsAnswered = attemptQuestions.every(
        (q) => answers[q._id]?.length > 0,
    );

    const currentQuestionIndex = selectedQuestion
        ? attemptQuestions.findIndex((q) => q._id === selectedQuestion._id) + 1
        : 1;

    const answeredCount = Object.keys(answers).filter(
        (qId) => answers[qId]?.length > 0,
    ).length;

    const timeColor =
        timeRemaining <= 60
            ? "text-error"
            : timeRemaining <= 300
              ? "text-warning"
              : "text-success";

    if (!currentAttempt || !attemptQuestions.length) {
        return (
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
            {/* Header with Timer */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Quiz
                        </h1>
                        <p className="text-sm text-gray-600">
                            Question {currentQuestionIndex} of{" "}
                            {attemptQuestions.length}
                        </p>
                    </div>

                    {/* Timer Display */}
                    <div
                        className={`card bg-white shadow-lg border-2 ${
                            timeRemaining <= 60
                                ? "border-error"
                                : timeRemaining <= 300
                                  ? "border-warning"
                                  : "border-success"
                        }`}
                    >
                        <div className="card-body p-4 text-center">
                            <div
                                className={`text-4xl font-black font-mono ${timeColor}`}
                            >
                                {formatTime(timeRemaining)}
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                                Remaining
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning Banner */}
                {showWarning && (
                    <div className="bg-warning/10 border-t border-warning/50 px-6 py-3 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                        <p className="text-sm font-semibold text-warning-700">
                            ⏰ Only {Math.ceil(timeRemaining / 60)} minutes
                            remaining. Quiz will auto-submit when time runs out.
                        </p>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar - Question Checklist */}
                    <div className="lg:col-span-1">
                        <div className="card bg-white shadow-lg border border-slate-200 sticky top-24">
                            <div className="card-body">
                                <h2 className="card-title text-lg mb-1">
                                    Questions
                                </h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    {answeredCount} / {attemptQuestions.length}{" "}
                                    answered
                                </p>

                                {/* Progress Bar */}
                                <progress
                                    className="progress progress-primary w-full mb-4"
                                    value={answeredCount}
                                    max={attemptQuestions.length}
                                ></progress>

                                {/* Question List */}
                                <div className="space-y-1 max-h-96 overflow-y-auto">
                                    {attemptQuestions.map((question, index) => {
                                        const isAnswered =
                                            answers[question._id]?.length > 0;
                                        const isSelected =
                                            selectedQuestion?._id ===
                                            question._id;

                                        return (
                                            <button
                                                key={question._id}
                                                onClick={() =>
                                                    setSelectedQuestion(
                                                        question,
                                                    )
                                                }
                                                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                                                    isSelected
                                                        ? "bg-blue-100 border border-blue-300"
                                                        : isAnswered
                                                          ? "bg-green-50 hover:bg-green-100 border border-green-200"
                                                          : "hover:bg-slate-100 border border-slate-200"
                                                }`}
                                            >
                                                <div
                                                    className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        isAnswered
                                                            ? "bg-green-500 text-white"
                                                            : isSelected
                                                              ? "bg-blue-600 text-white"
                                                              : "bg-gray-300 text-gray-600"
                                                    }`}
                                                >
                                                    {isAnswered
                                                        ? "✓"
                                                        : index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        Q{index + 1}
                                                    </p>
                                                    {savingIndices.has(
                                                        question._id,
                                                    ) && (
                                                        <p className="text-xs text-blue-600 flex items-center gap-1">
                                                            <Save className="w-3 h-3" />
                                                            Saving...
                                                        </p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Question Area */}
                    <div className="lg:col-span-3">
                        <div className="card bg-white shadow-lg border border-slate-200">
                            <div className="card-body p-8">
                                {selectedQuestion && (
                                    <>
                                        {/* Question Header */}
                                        <div className="mb-8">
                                            <div className="flex items-start justify-between mb-4">
                                                <h2 className="text-2xl font-bold text-gray-900 flex-1 leading-relaxed">
                                                    {selectedQuestion.prompt}
                                                </h2>
                                                <div className="badge badge-primary ml-4 shrink-0">
                                                    {selectedQuestion.points} pt
                                                    {selectedQuestion.points !==
                                                    1
                                                        ? "s"
                                                        : ""}
                                                </div>
                                            </div>

                                            {/* Auto-save Status */}
                                            {savingIndices.has(
                                                selectedQuestion._id,
                                            ) && (
                                                <div className="flex items-center gap-2 text-blue-600 text-sm">
                                                    <Save className="w-4 h-4 animate-spin" />
                                                    <span>
                                                        Saving your answer...
                                                    </span>
                                                </div>
                                            )}
                                            {!savingIndices.has(
                                                selectedQuestion._id,
                                            ) &&
                                                answers[selectedQuestion._id]
                                                    ?.length > 0 && (
                                                    <div className="flex items-center gap-2 text-success text-sm">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>
                                                            Answer saved
                                                        </span>
                                                    </div>
                                                )}
                                        </div>

                                        {/* Answer Choices */}
                                        <div className="space-y-3 mb-8">
                                            {selectedQuestion.choices &&
                                            selectedQuestion.choices.length >
                                                0 ? (
                                                selectedQuestion.choices.map(
                                                    (choice) => {
                                                        const isSelected =
                                                            answers[
                                                                selectedQuestion
                                                                    ._id
                                                            ]?.includes(
                                                                choice._id,
                                                            ) ?? false;

                                                        return (
                                                            <label
                                                                key={choice._id}
                                                                className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                                    isSelected
                                                                        ? "border-blue-500 bg-blue-50"
                                                                        : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                                                                }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${selectedQuestion._id}`}
                                                                    value={
                                                                        choice._id
                                                                    }
                                                                    checked={
                                                                        isSelected
                                                                    }
                                                                    onChange={() =>
                                                                        handleAnswerChange(
                                                                            selectedQuestion._id,
                                                                            choice._id,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isSubmitting
                                                                    }
                                                                    className="radio radio-primary mt-1 shrink-0"
                                                                />
                                                                <span
                                                                    className={`ml-4 text-base ${
                                                                        isSelected
                                                                            ? "font-semibold text-gray-900"
                                                                            : "text-gray-700"
                                                                    }`}
                                                                >
                                                                    {
                                                                        choice.text
                                                                    }
                                                                </span>
                                                                {isSelected && (
                                                                    <CheckCircle className="w-5 h-5 text-blue-600 ml-auto shrink-0" />
                                                                )}
                                                            </label>
                                                        );
                                                    },
                                                )
                                            ) : (
                                                <div className="alert alert-info">
                                                    <AlertCircle className="w-5 h-5" />
                                                    <span>
                                                        No choices available
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Navigation */}
                                        <div className="divider my-6"></div>

                                        <div className="flex gap-4 items-center justify-between">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => {
                                                        const idx =
                                                            attemptQuestions.findIndex(
                                                                (q) =>
                                                                    q._id ===
                                                                    selectedQuestion._id,
                                                            );
                                                        if (idx > 0) {
                                                            setSelectedQuestion(
                                                                attemptQuestions[
                                                                    idx - 1
                                                                ],
                                                            );
                                                        }
                                                    }}
                                                    disabled={
                                                        attemptQuestions.findIndex(
                                                            (q) =>
                                                                q._id ===
                                                                selectedQuestion._id,
                                                        ) === 0 || isSubmitting
                                                    }
                                                    className="btn btn-ghost gap-2"
                                                >
                                                    <ChevronLeft className="w-5 h-5" />
                                                    Previous
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        const idx =
                                                            attemptQuestions.findIndex(
                                                                (q) =>
                                                                    q._id ===
                                                                    selectedQuestion._id,
                                                            );
                                                        if (
                                                            idx <
                                                            attemptQuestions.length -
                                                                1
                                                        ) {
                                                            setSelectedQuestion(
                                                                attemptQuestions[
                                                                    idx + 1
                                                                ],
                                                            );
                                                        }
                                                    }}
                                                    disabled={
                                                        attemptQuestions.findIndex(
                                                            (q) =>
                                                                q._id ===
                                                                selectedQuestion._id,
                                                        ) ===
                                                            attemptQuestions.length -
                                                                1 ||
                                                        isSubmitting
                                                    }
                                                    className="btn btn-ghost gap-2"
                                                >
                                                    Next
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={handleAutoSubmit}
                                                disabled={
                                                    isSubmitting ||
                                                    !allQuestionsAnswered
                                                }
                                                className="btn btn-success gap-2"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <span className="loading loading-spinner loading-xs"></span>
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        Submit Quiz
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Incomplete Warning */}
                                        {!allQuestionsAnswered && (
                                            <div className="alert alert-warning mt-6">
                                                <AlertTriangle className="w-5 h-5" />
                                                <span>
                                                    Please answer all questions
                                                    before submitting.
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Attempt Error Toast */}
            {attemptError && (
                <div className="toast toast-end">
                    <div className="alert alert-error">
                        <span>{attemptError}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentQuizPage;
