import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useQuizStore from "../stores/Quizstore";
import useAuthStore from "../stores/Authstore";

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
    const { token } = useAuthStore();

    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: [choiceIds] }
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [showWarning, setShowWarning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [savingIndices, setSavingIndices] = useState(new Set());
    const [isSaved, setIsSaved] = useState(true);

    // Initialize with first question
    useEffect(() => {
        if (attemptQuestions.length > 0 && !selectedQuestion) {
            setSelectedQuestion(attemptQuestions[0]);
        }
    }, [attemptQuestions, selectedQuestion]);

    // Timer countdown logic
    useEffect(() => {
        if (!currentAttempt?.endAt) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const endTime = new Date(currentAttempt.endAt).getTime();
            const remaining = Math.max(0, endTime - now);
            const remainingSeconds = Math.floor(remaining / 1000);

            setTimeRemaining(remainingSeconds);

            // Show warning at 5 minutes (300 seconds)
            if (
                remainingSeconds <= 300 &&
                remainingSeconds > 0 &&
                !showWarning
            ) {
                setShowWarning(true);
            }

            // Auto-submit when time is up
            if (remainingSeconds <= 0) {
                handleAutoSubmit();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [currentAttempt?.endAt, showWarning]);

    // Handle auto-submit when time expires
    const handleAutoSubmit = useCallback(async () => {
        setIsSubmitting(true);
        const result = await submitAttempt(attemptId);
        if (result) {
            navigate(`/student/quiz/${attemptId}/results`);
        }
    }, [attemptId, submitAttempt, navigate]);

    // Debounced auto-save
    const handleAnswerChange = useCallback(
        async (questionId, choiceId) => {
            // Update local state
            setAnswers((prev) => {
                const currentAnswers = prev[questionId] || [];
                // For MCQ single choice, only one answer allowed
                return {
                    ...prev,
                    [questionId]: [choiceId],
                };
            });

            // Debounced API call
            setSavingIndices((prev) => new Set(prev).add(questionId));
            setIsSaved(false);

            // Debounce for 500ms
            const timeoutId = setTimeout(async () => {
                const success = await submitAnswer(attemptId, questionId, [
                    choiceId,
                ]);
                if (success) {
                    setIsSaved(true);
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

    // Format time as MM:SS
    const formatTime = (seconds) => {
        if (seconds === null) return "00:00";
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    // Check if all questions answered
    const allQuestionsAnswered = attemptQuestions.every(
        (q) => answers[q._id]?.length > 0,
    );

    if (!currentAttempt || !attemptQuestions.length) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <p className="text-gray-600 text-lg mb-4">
                        Loading quiz...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with timer and title */}
            <div className="bg-white border-b sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Quiz
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Question{" "}
                            {(selectedQuestion &&
                                attemptQuestions.findIndex(
                                    (q) => q._id === selectedQuestion._id,
                                ) + 1) ||
                                1}{" "}
                            of {attemptQuestions.length}
                        </p>
                    </div>
                    <div
                        className={`text-center ${timeRemaining <= 300 ? "bg-yellow-100" : ""} p-3 rounded-lg`}
                    >
                        <div
                            className={`text-4xl font-bold font-mono ${
                                timeRemaining <= 300
                                    ? "text-yellow-600"
                                    : timeRemaining <= 60
                                      ? "text-red-600"
                                      : "text-green-600"
                            }`}
                        >
                            {formatTime(timeRemaining)}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                            Time Remaining
                        </p>
                        {showWarning && timeRemaining > 60 && (
                            <p className="text-yellow-700 font-semibold text-sm mt-2">
                                ⚠️ 5 minutes left!
                            </p>
                        )}
                        {timeRemaining <= 60 && timeRemaining > 0 && (
                            <p className="text-red-700 font-semibold text-sm mt-2">
                                🔴 Final minute!
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Warning banner */}
            {showWarning && (
                <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
                    <p className="text-yellow-800 font-semibold">
                        ⏰ Quiz will auto-submit when time runs out.
                    </p>
                </div>
            )}

            {/* Main content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar - Question Checklist */}
                    <div className="w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg border shadow-sm sticky top-24">
                            <div className="p-4 border-b">
                                <h2 className="font-bold text-gray-900">
                                    Questions
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    {
                                        Object.keys(answers).filter(
                                            (qId) => answers[qId]?.length > 0,
                                        ).length
                                    }{" "}
                                    / {attemptQuestions.length} answered
                                </p>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {attemptQuestions.map((question, index) => {
                                    const isAnswered =
                                        answers[question._id]?.length > 0;
                                    const isSelected =
                                        selectedQuestion?._id === question._id;
                                    return (
                                        <button
                                            key={question._id}
                                            onClick={() =>
                                                setSelectedQuestion(question)
                                            }
                                            className={`w-full text-left px-4 py-3 border-b hover:bg-blue-50 transition-colors ${
                                                isSelected
                                                    ? "bg-blue-100 border-l-4 border-l-blue-600"
                                                    : ""
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                                        isAnswered
                                                            ? "bg-green-500 text-white"
                                                            : "bg-gray-300 text-gray-600"
                                                    }`}
                                                >
                                                    {isAnswered
                                                        ? "✓"
                                                        : index + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        Q{index + 1}
                                                    </p>
                                                    {savingIndices.has(
                                                        question._id,
                                                    ) && (
                                                        <p className="text-xs text-blue-600">
                                                            Saving...
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main content area - Question and Choices */}
                    <div className="flex-1 max-w-2xl">
                        <div className="bg-white rounded-lg border shadow-sm p-8">
                            {selectedQuestion && (
                                <>
                                    {/* Question text */}
                                    <div className="mb-8">
                                        <div className="flex items-start justify-between mb-2">
                                            <h2 className="text-xl font-bold text-gray-900 flex-1">
                                                {selectedQuestion.prompt}
                                            </h2>
                                            <span className="ml-4 text-xs font-semibold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                                {selectedQuestion.points} pt
                                                {selectedQuestion.points !== 1
                                                    ? "s"
                                                    : ""}
                                            </span>
                                        </div>
                                        {savingIndices.has(
                                            selectedQuestion._id,
                                        ) && (
                                            <p className="text-sm text-blue-600 mt-2">
                                                💾 Saving your answer...
                                            </p>
                                        )}
                                        {!savingIndices.has(
                                            selectedQuestion._id,
                                        ) &&
                                            answers[selectedQuestion._id]
                                                ?.length > 0 && (
                                                <p className="text-sm text-green-600 mt-2">
                                                    ✓ Answer saved
                                                </p>
                                            )}
                                    </div>

                                    {/* Multiple choice options */}
                                    <div className="space-y-3">
                                        {selectedQuestion.choices &&
                                        selectedQuestion.choices.length > 0 ? (
                                            selectedQuestion.choices.map(
                                                (choice) => {
                                                    const isSelected =
                                                        answers[
                                                            selectedQuestion._id
                                                        ]?.includes(
                                                            choice._id,
                                                        ) ?? false;
                                                    return (
                                                        <label
                                                            key={choice._id}
                                                            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                                                isSelected
                                                                    ? "border-blue-500 bg-blue-50"
                                                                    : "border-gray-200 hover:border-gray-300"
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
                                                                className="mt-1 w-4 h-4 cursor-pointer"
                                                                disabled={
                                                                    isSubmitting
                                                                }
                                                            />
                                                            <span
                                                                className={`ml-3 text-base ${
                                                                    isSelected
                                                                        ? "font-semibold"
                                                                        : ""
                                                                } text-gray-800`}
                                                            >
                                                                {choice.text}
                                                            </span>
                                                        </label>
                                                    );
                                                },
                                            )
                                        ) : (
                                            <p className="text-gray-500">
                                                No choices available.
                                            </p>
                                        )}
                                    </div>

                                    {/* Navigation buttons */}
                                    <div className="flex gap-4 mt-12">
                                        <button
                                            onClick={() => {
                                                const currentIndex =
                                                    attemptQuestions.findIndex(
                                                        (q) =>
                                                            q._id ===
                                                            selectedQuestion._id,
                                                    );
                                                if (currentIndex > 0) {
                                                    setSelectedQuestion(
                                                        attemptQuestions[
                                                            currentIndex - 1
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
                                            className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            ← Previous
                                        </button>

                                        <button
                                            onClick={() => {
                                                const currentIndex =
                                                    attemptQuestions.findIndex(
                                                        (q) =>
                                                            q._id ===
                                                            selectedQuestion._id,
                                                    );
                                                if (
                                                    currentIndex <
                                                    attemptQuestions.length - 1
                                                ) {
                                                    setSelectedQuestion(
                                                        attemptQuestions[
                                                            currentIndex + 1
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
                                                        1 || isSubmitting
                                            }
                                            className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Next →
                                        </button>

                                        <button
                                            onClick={handleAutoSubmit}
                                            disabled={
                                                isSubmitting ||
                                                !allQuestionsAnswered
                                            }
                                            className="ml-auto px-8 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSubmitting
                                                ? "Submitting..."
                                                : "Submit Quiz"}
                                        </button>
                                    </div>

                                    {!allQuestionsAnswered && (
                                        <p className="text-sm text-yellow-600 mt-4 text-center">
                                            ⚠️ Please answer all questions
                                            before submitting.
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Error message */}
            {attemptError && (
                <div className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg">
                    {attemptError}
                </div>
            )}
        </div>
    );
}

export default StudentQuizPage;
