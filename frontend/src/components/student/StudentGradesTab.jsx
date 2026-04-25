import { Award } from "lucide-react";
import AnalyticsDashboard from "../AnalyticsDashboard";

export default function StudentGradesTab({
    gradesLoading,
    gradesError,
    myGrades,
    viewContentCourse
}) {
    return (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                        <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    My Grade History
                </h2>

                {viewContentCourse && (
                    <div className="mb-10">
                        <AnalyticsDashboard courseId={viewContentCourse._id} mode="student" />
                    </div>
                )}

                {gradesLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="loading loading-spinner loading-lg text-emerald-500"></span>
                    </div>
                ) : gradesError ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
                        <span>{gradesError}</span>
                    </div>
                ) : myGrades.length === 0 ? (
                    <div className="text-center py-16 bg-slate-50/50 dark:bg-base-200/50 rounded-2xl border border-slate-200 border-dashed dark:border-slate-700">
                        <Award className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">
                            No graded attempts available yet.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50">
                        <table className="table w-full">
                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                <tr>
                                    <th className="font-semibold">Quiz</th>
                                    <th className="font-semibold">Course</th>
                                    <th className="font-semibold">Score</th>
                                    <th className="font-semibold">Date</th>
                                    <th className="font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {myGrades.map((grade) => (
                                    <tr key={grade.attemptId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="font-medium text-slate-900 dark:text-slate-200">
                                            {grade.quiz?.title || "Unnamed Quiz"}
                                        </td>
                                        <td className="text-slate-600 dark:text-slate-400">
                                            {grade.course?.title || "Unknown Course"}
                                        </td>
                                        <td className="font-bold text-lg text-slate-900 dark:text-white">
                                            {grade.score}%
                                        </td>
                                        <td className="text-slate-600 dark:text-slate-400 text-sm">
                                            {grade.submittedAt
                                                ? new Date(grade.submittedAt).toLocaleString()
                                                : "-"}
                                        </td>
                                        <td>
                                            <span
                                                className={`badge badge-sm font-medium ${
                                                    grade.status === "graded"
                                                        ? "badge-success bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50"
                                                        : grade.status === "late"
                                                          ? "badge-warning bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
                                                          : "badge-error bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50"
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
        </div>
    );
}
