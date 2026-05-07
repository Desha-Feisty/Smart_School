import { useOutletContext } from "react-router-dom";
import { Users } from "lucide-react";

function AdminAnalytics() {
    const context = useOutletContext() || {};
    const { courseAnalytics = [] } = context;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courseAnalytics.map((course) => (
                <div key={course.id} className="glass-panel overflow-hidden group hover:scale-[1.01] transition-all">
                    <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{course.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {course.teacher}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{course.avgScore}%</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Score</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-slate-100 dark:border-slate-800 pt-5 mt-4">
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Students</div>
                                <div className="font-bold text-slate-900 dark:text-white">{course.enrollmentCount}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Quizzes</div>
                                <div className="font-bold text-slate-900 dark:text-white">{course.quizCount}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Attempts</div>
                                <div className="font-bold text-slate-900 dark:text-white">{course.participation}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default AdminAnalytics;