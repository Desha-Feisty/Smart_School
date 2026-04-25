import { Award } from "lucide-react";

export default function CourseGradesTab({
    quizzes,
    selectedQuiz,
    setSelectedQuiz,
    selectedQuizTitle,
    setSelectedQuizTitle,
    gradesLoading,
    gradesError,
    quizGrades
}) {
    return (
        <div className="glass-panel overflow-hidden rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-xl">
            <div className="p-8">
                <h2 className="card-title text-2xl mb-6 flex items-center gap-2">
                    <Award className="w-6 h-6 text-blue-600" />
                    Student Grades by Quiz
                </h2>

                {quizzes.length === 0 ? (
                    <div className="text-center py-12">
                        <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">
                            No quizzes available yet. Create a quiz
                            to see student grades.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Quiz Selection */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {quizzes.map((quiz) => (
                                <button
                                    key={quiz._id}
                                    onClick={() => {
                                        setSelectedQuiz(quiz._id);
                                        setSelectedQuizTitle(quiz.title);
                                    }}
                                    className={`card transition-all cursor-pointer border ${
                                        selectedQuiz === quiz._id
                                            ? "border-blue-500 shadow-md bg-blue-50 dark:bg-blue-900/20"
                                            : "border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 hover:shadow-md"
                                    }`}
                                >
                                    <div className="card-body p-4">
                                        <h3 className="font-semibold text-gray-900">
                                            {quiz.title}
                                        </h3>
                                        <p className="text-xs text-gray-600 truncate">
                                            {quiz.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Grades Table */}
                        {selectedQuiz && (
                            <div className="border-t border-slate-200 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Grades for: {selectedQuizTitle}
                                </h3>

                                {gradesLoading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <span className="loading loading-spinner loading-lg text-blue-600"></span>
                                    </div>
                                ) : gradesError ? (
                                    <div className="alert alert-error">
                                        <span>{gradesError}</span>
                                    </div>
                                ) : quizGrades.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">
                                            No graded submissions found yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra w-full">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="text-gray-700 font-semibold">Name</th>
                                                    <th className="text-gray-700 font-semibold">Email</th>
                                                    <th className="text-gray-700 font-semibold">Score</th>
                                                    <th className="text-gray-700 font-semibold">Submitted</th>
                                                    <th className="text-gray-700 font-semibold">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {quizGrades.map((grade) => (
                                                    <tr key={grade.attemptId}>
                                                        <td className="font-medium">
                                                            {grade.student?.name || "Unknown"}
                                                        </td>
                                                        <td className="text-gray-600">
                                                            {grade.student?.email || "-"}
                                                        </td>
                                                        <td className="font-bold text-lg">
                                                            {grade.score}%
                                                        </td>
                                                        <td className="text-gray-600">
                                                            {grade.submittedAt
                                                                ? new Date(grade.submittedAt).toLocaleString()
                                                                : "-"}
                                                        </td>
                                                        <td>
                                                            <span
                                                                className={`badge ${
                                                                    grade.status === "graded"
                                                                        ? "badge-success"
                                                                        : grade.status === "late"
                                                                        ? "badge-warning"
                                                                        : "badge-error"
                                                                }`}
                                                            >
                                                                {grade.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
