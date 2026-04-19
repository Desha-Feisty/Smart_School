import { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../stores/Authstore";
import { Trophy, Medal, Crown, User, Star } from "lucide-react";

function Leaderboard({ courseId, isTeacher = false }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token, user } = useAuthStore();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`/api/leaderboard/course/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLeaderboard(response.data.leaderboard || []);
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
                setError(err.response?.data?.error || "Failed to load rankings. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        if (courseId && token) {
            fetchLeaderboard();
        }
    }, [courseId, token]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 glass-panel border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-base-300/50">
                <span className="loading loading-spinner text-yellow-500 mb-4 loading-lg"></span>
                <p className="text-sm font-medium text-slate-500 animate-pulse">Calculating rankings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-12 glass-panel border border-red-200/50 dark:border-red-900/30 bg-red-50/10 dark:bg-red-900/5">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-xs mb-6">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="btn btn-outline btn-sm rounded-xl px-6"
                >
                    Try Refreshing
                </button>
            </div>
        );
    }

    if (leaderboard.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 glass-panel border-dashed border-slate-300 dark:border-slate-700">
                <Medal className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">No scores recorded yet. Be the first to top the board!</p>
            </div>
        );
    }

    const topThree = leaderboard.slice(0, 3);
    const rest = leaderboard.slice(3);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Top 3 Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-10 pb-6 px-4">
                {/* 2nd Place */}
                {topThree[1] && (
                    <div className="order-2 md:order-1 flex flex-col items-center space-y-3 group">
                        <div className="relative">
                            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-300 dark:border-slate-600 shadow-xl group-hover:scale-110 transition-transform">
                                <span className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                                    {topThree[1].fullName?.charAt(0) || "?"}
                                </span>
                                <div className="absolute -top-3 -right-2 bg-slate-400 text-white rounded-full p-1.5 shadow-lg">
                                    <Medal className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{topThree[1].fullName}</p>
                            <p className="text-2xl font-black text-slate-600">{topThree[1].averageScore}% avg</p>
                        </div>
                        <div className="w-full h-16 bg-slate-200 dark:bg-slate-800/50 rounded-t-2xl border-x border-t border-slate-300 dark:border-slate-700 shadow-lg"></div>
                    </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                    <div className="order-1 md:order-2 flex flex-col items-center space-y-4 group -mt-6">
                        <div className="relative">
                            <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-yellow-500 animate-bounce" />
                            <div className="w-28 h-28 bg-yellow-50 dark:bg-yellow-900/20 rounded-full flex items-center justify-center border-4 border-yellow-500 shadow-2xl shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                                <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {topThree[0].fullName?.charAt(0) || "?"}
                                </span>
                                <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-2 shadow-lg">
                                    <Trophy className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-black text-slate-900 dark:text-white">{topThree[0].fullName}</p>
                            <p className="text-3xl font-black text-yellow-600">{topThree[0].averageScore}% avg</p>
                        </div>
                        <div className="w-full h-28 bg-gradient-to-t from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-900/10 rounded-t-2xl border-x border-t border-yellow-300 dark:border-yellow-700/50 shadow-2xl"></div>
                    </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <div className="order-3 flex flex-col items-center space-y-3 group">
                        <div className="relative">
                            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center border-4 border-amber-600 dark:border-amber-700 shadow-xl group-hover:scale-110 transition-transform">
                                <span className="text-xl font-bold text-amber-700 dark:text-amber-500">
                                    {topThree[2].fullName?.charAt(0) || "?"}
                                </span>
                                <div className="absolute -top-2 -right-2 bg-amber-600 text-white rounded-full p-1 shadow-lg">
                                    <Star className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-800 dark:text-slate-200">{topThree[2].fullName}</p>
                            <p className="text-xl font-black text-amber-700">{topThree[2].averageScore}% avg</p>
                        </div>
                        <div className="w-full h-12 bg-amber-100/50 dark:bg-amber-900/10 rounded-t-2xl border-x border-t border-amber-200 dark:border-amber-800/30 shadow-md"></div>
                    </div>
                )}
            </div>

            {/* Rest of the leaderboard */}
            {rest.length > 0 && (
                <div className="glass-panel overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rest.map((entry, index) => (
                            <div key={index} className="flex items-center justify-between p-4 px-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-slate-400 w-6">#{index + 4}</span>
                                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                        {entry.fullName?.charAt(0) || "?"}
                                    </div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                        {entry.fullName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm text-slate-400">Average Score</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{entry.averageScore}%</p>
                                    </div>
                                    <div className="text-right w-24">
                                        <p className="text-sm text-slate-400">Quizzes Solved</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{entry.quizzesAttempted}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* User's own position if not in top list (Optional Enhancement) */}
            {!isTeacher && !leaderboard.find(e => e.fullName === user?.name) && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 text-center">
                    <p className="text-blue-700 dark:text-blue-300 text-sm">You haven't earned any points yet. Take a quiz to join the leaderboard!</p>
                </div>
            )}
        </div>
    );
}

export default Leaderboard;
