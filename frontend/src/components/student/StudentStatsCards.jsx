import { BookOpen, Zap, Award } from "lucide-react";

export default function StudentStatsCards({
    allCourses,
    availableQuizzes,
    avgScore,
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10">
                <div className="card-body p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                My Courses
                            </p>
                            <p className="text-4xl font-bold text-slate-900 dark:text-white">
                                {allCourses.length}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl">
                            <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card bg-gradient-to-br from-yellow-500/10 to-orange-500/5 dark:from-yellow-500/20 dark:to-orange-500/10">
                <div className="card-body p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                Quizzes Available
                            </p>
                            <p className="text-4xl font-bold text-slate-900 dark:text-white">
                                {availableQuizzes.length}
                            </p>
                        </div>
                        <div className="p-3 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-2xl">
                            <Zap className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10">
                <div className="card-body p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                Average Score
                            </p>
                            <p className="text-4xl font-bold text-slate-900 dark:text-white">
                                {avgScore}%
                            </p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl">
                            <Award className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
