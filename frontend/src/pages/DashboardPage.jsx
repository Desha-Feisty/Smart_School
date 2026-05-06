import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import useAuthStore from "../stores/Authstore";
import useTeacherStore from "../stores/Teacherstore";
import useQuizStore from "../stores/Quizstore";
import ProgressCard from "../components/dashboard/ProgressCard";
import CourseCalendar from "../components/dashboard/CourseCalendar";
import {
    BookOpen,
    Zap,
    FileText,
    TrendingUp,
    Clock,
    Award,
    ArrowRight,
    Calendar,
    BarChart3,
} from "lucide-react";

function DashboardPage() {
    const navigate = useNavigate();
    const { user, role, token } = useAuthStore();
    const { allCourses, listMyCourses } = useTeacherStore();
    const { availableQuizzes, myGrades, fetchAvailableQuizzes, listMyGrades } = useQuizStore();
    
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCourses: 0,
        totalQuizzes: 0,
        completedQuizzes: 0,
        averageScore: 0,
        totalNotes: 0,
        enrollmentCount: 0,
    });

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        
        const loadData = async () => {
            setIsLoading(true);
            
            // Base promises for both roles
            const promises = [listMyCourses()];
            
            // Student-only endpoints
            if (role === "student") {
                promises.push(fetchAvailableQuizzes(), listMyGrades());
            }
            
            await Promise.all(promises);
            setIsLoading(false);
        };
        
        loadData();
    }, [token, role, navigate, listMyCourses, fetchAvailableQuizzes, listMyGrades]);

    useEffect(() => {
        // Calculate stats
        const completed = myGrades.filter((g) => g.status === "graded" || g.status === "late");
        const avgScore = completed.length > 0
            ? Math.round(completed.reduce((sum, g) => sum + (g.score || 0), 0) / completed.length)
            : 0;

        setStats({
            totalCourses: allCourses.length,
            totalQuizzes: availableQuizzes.length,
            completedQuizzes: completed.length,
            averageScore: avgScore,
            totalNotes: 0, // Will be fetched from API
            enrollmentCount: allCourses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0),
        });
    }, [allCourses, availableQuizzes, myGrades]);

    const upcomingQuizzes = availableQuizzes
        .filter((q) => q.timingStatus === "open")
        .slice(0, 3);

    const recentGrades = myGrades
        .filter((g) => g.score !== null)
        .slice(0, 5);

    const isStudent = role === "student";

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-violet-200 dark:border-violet-700 border-t-violet-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 space-y-6"
        >
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Welcome back, {user?.name?.split(" ")[0]}!
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Here's your learning overview for today
                    </p>
                </div>
                <div className="hidden md:block">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <ProgressCard
                    title="My Courses"
                    value={stats.totalCourses}
                    icon={BookOpen}
                    color="violet"
                    type="stat"
                />
                <ProgressCard
                    title="Available Quizzes"
                    value={stats.totalQuizzes}
                    icon={Zap}
                    color="blue"
                    type="stat"
                />
                <ProgressCard
                    title="Completed"
                    value={stats.completedQuizzes}
                    subtitle={`of ${stats.totalQuizzes + stats.completedQuizzes} total`}
                    icon={FileText}
                    color="green"
                    type="stat"
                />
                <ProgressCard
                    title="Average Score"
                    value={`${stats.averageScore}%`}
                    subtitle={stats.completedQuizzes > 0 ? "Great progress!" : "No grades yet"}
                    icon={Award}
                    color={stats.averageScore >= 80 ? "green" : stats.averageScore >= 60 ? "amber" : "red"}
                    type="stat"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Upcoming Quizzes */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Upcoming Quizzes */}
                    <div className="bg-white dark:bg-base-200 rounded-3xl p-6 shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Upcoming Quizzes
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Ready to take
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate("/student/quizzes")}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                            >
                                View all
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        {upcomingQuizzes.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No quizzes available right now</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingQuizzes.map((quiz) => (
                                    <motion.button
                                        key={quiz._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        onClick={() => navigate(`/student/quiz/${quiz._id}`)}
                                        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 dark:text-white truncate">
                                                {quiz.title}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {quiz.course?.title} • {quiz.durationMinutes} min
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                                                Start
                                            </span>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Calendar */}
                    <CourseCalendar
                        events={availableQuizzes.map((q) => ({
                            ...q,
                            type: "quiz",
                        }))}
                    />
                </div>

                {/* Right Column - Recent Grades & Quick Actions */}
                <div className="space-y-6">
                    {/* Recent Grades */}
                    <div className="bg-white dark:bg-base-200 rounded-3xl p-6 shadow-md">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Recent Grades
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Your latest scores
                                </p>
                            </div>
                        </div>

                        {recentGrades.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No grades yet</p>
                                <p className="text-sm">Complete a quiz to see your score</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentGrades.map((grade, index) => (
                                    <motion.div
                                        key={grade.attemptId}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30"
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                                            grade.score >= 80
                                                ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                                                : grade.score >= 60
                                                    ? "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                                    : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                                        }`}>
                                            {grade.score}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 dark:text-white truncate">
                                                {grade.quiz?.title}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {grade.course?.title}
                                            </p>
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                                            grade.status === "graded"
                                                ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                                                : "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                        }`}>
                                            {grade.status}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => navigate("/student/grades")}
                            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            View all grades
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-base-200 rounded-3xl p-6 shadow-md">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate("/student/quizzes")}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Take Quiz
                                </span>
                            </button>
                            <button
                                onClick={() => navigate("/student/calendar")}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <Calendar className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Calendar
                                </span>
                            </button>
                            <button
                                onClick={() => navigate("/student/analytics")}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Analytics
                                </span>
                            </button>
                            <button
                                onClick={() => navigate("/leaderboard")}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Rankings
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Course Progress */}
                    <div className="bg-white dark:bg-base-200 rounded-3xl p-6 shadow-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Course Progress
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Your learning journey
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {allCourses.slice(0, 3).map((course, index) => (
                                <ProgressCard
                                    key={course._id}
                                    title={course.title}
                                    value={Math.floor(Math.random() * 60 + 20)}
                                    total={100}
                                    subtitle={`${course.enrollmentCount || 0} enrolled`}
                                    icon={BookOpen}
                                    color="violet"
                                    type="compact"
                                />
                            ))}
                            {allCourses.length === 0 && (
                                <p className="text-center py-4 text-slate-500 dark:text-slate-400">
                                    No courses yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default DashboardPage;