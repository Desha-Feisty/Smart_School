import { useEffect, useState, useCallback } from "react";
import useAuthStore from "../stores/Authstore";
import useTeacherStore from "../stores/Teacherstore";
import useQuizStore from "../stores/Quizstore";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NoteCard from "../components/NoteCard";
import ChatWindow from "../components/ChatWindow";
import PageWrapper from "../components/layout/PageWrapper";
import Navbar from "../components/layout/Navbar";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import Leaderboard from "../components/Leaderboard";
import toast from "react-hot-toast";
import {
    BookOpen,
    Plus,
    Zap,
    TrendingUp,
    MessageSquare,
    ChevronRight,
    BookMarked,
    Award,
    Clock,
    X,
    CheckCircle,
    Trophy,
} from "lucide-react";

function StudentPage() {
    const { token, user, logout } = useAuthStore();
    const { allCourses, listMyCourses, listCourseNotes } = useTeacherStore();
    const {
        startAttempt,
        attemptError,
        myGrades,
        gradesLoading,
        gradesError,
        listMyGrades,
        availableQuizzes,
        fetchAvailableQuizzes,
    } = useQuizStore();
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState("");
    const [activeTab, setActiveTab] = useState("courses");
    const [isLoading, setIsLoading] = useState(false);
    const [startingQuizId, setStartingQuizId] = useState(null);
    const [viewContentCourse, setViewContentCourse] = useState(null);
    const [courseContentNotes, setCourseContentNotes] = useState([]);
    const [contentNotesLoading, setContentNotesLoading] = useState(false);
    const [allCourseNotes, setAllCourseNotes] = useState([]);
    const [allNotesLoading, setAllNotesLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatCourseId, setChatCourseId] = useState(null);
    const [chatPeerId, setChatPeerId] = useState(null);
    const [chatPeerName, setChatPeerName] = useState("");


    const loadAllCourseNotes = useCallback(async () => {
        setAllNotesLoading(true);
        try {
            const allNotes = [];
            for (const course of allCourses) {
                const notes = await listCourseNotes(course._id);
                allNotes.push(...notes);
            }
            setAllCourseNotes(allNotes);
        } catch (err) {
            toast.error(err.message || "Failed to load notes");
            setAllCourseNotes([]);
        } finally {
            setAllNotesLoading(false);
        }
    }, [allCourses, listCourseNotes]);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        listMyCourses();
        fetchAvailableQuizzes();
        listMyGrades();
    }, [token, navigate, fetchAvailableQuizzes, listMyCourses, listMyGrades]);

    useEffect(() => {
        if (activeTab === "quizzes") {
            fetchAvailableQuizzes();
            const interval = setInterval(fetchAvailableQuizzes, 30000); // 30s poll for status changes
            return () => clearInterval(interval);
        }
    }, [activeTab, fetchAvailableQuizzes]);

    useEffect(() => {
        if (activeTab === "grades") {
            listMyGrades();
        }
    }, [activeTab, listMyGrades]);

    useEffect(() => {
        if (activeTab === "community") {
            loadAllCourseNotes();
        }
    }, [activeTab, loadAllCourseNotes]);

    const loadCourseContentNotes = async (courseId) => {
        setContentNotesLoading(true);
        try {
            const notes = await listCourseNotes(courseId);
            setCourseContentNotes(notes);
        } catch (err) {
            console.error("Failed to load course notes:", err);
            setCourseContentNotes([]);
        } finally {
            setContentNotesLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleJoinCourse = async (e) => {
        e.preventDefault();
        if (!joinCode.trim()) {
            toast.error("Please enter a join code");
            return;
        }
        setIsLoading(true);
        try {
            await axios.post(
                "/api/courses/join",
                { joinCode },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            setJoinCode("");
            listMyCourses();
            toast.success("Successfully joined course!");
        } catch (err) {
            toast.error(err.response?.data?.errMsg || "Failed to join course");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartQuiz = async (quizId) => {
        setStartingQuizId(quizId);
        try {
            const result = await startAttempt(quizId);
            if (result && result.attempt) {
                navigate(`/student/quiz/${result.attempt._id}`);
            } else {
                toast.error(attemptError || "Failed to start quiz");
            }
        } catch (err) {
            toast.error(
                err.message || "An error occurred while starting the quiz",
            );
        } finally {
            setStartingQuizId(null);
        }
    };

    // Calculate stats
    const avgScore =
        myGrades.length > 0
            ? (
                  myGrades.reduce((sum, g) => sum + g.score, 0) /
                  myGrades.length
              ).toFixed(1)
            : 0;

    return (
        <PageWrapper>
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-8 animate-in fade-in duration-500 w-full relative z-10">
                {/* Stats Cards */}
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

                {/* Join Course Section */}
                <div className="glass-panel rounded-2xl mb-10 overflow-hidden shadow-blue-500/5">
                    <div className="px-6 py-5 sm:p-8 flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                                <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Join a New Course
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Enter the code provided by your teacher
                                </p>
                            </div>
                        </div>
                        <form
                            onSubmit={handleJoinCourse}
                            className="flex gap-3 w-full md:w-auto md:min-w-[400px]"
                        >
                            <input
                                type="text"
                                placeholder="e.g. MATH101"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="input input-bordered flex-1 bg-white/50 dark:bg-base-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary shadow-lg shadow-blue-500/20"
                            >
                                {isLoading ? (
                                    <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                    "Join"
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Modern Pill Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-slate-200/50 dark:bg-base-300/50 p-1.5 rounded-2xl w-max border border-slate-200 dark:border-slate-700/50">
                    {[
                        { id: "courses", label: "My Courses", icon: BookOpen },
                        {
                            id: "quizzes",
                            label: "Available Quizzes",
                            icon: Zap,
                        },
                        { id: "leaderboard", label: "Leaderboard", icon: Trophy },
                        { id: "grades", label: "My Grades", icon: TrendingUp },
                        {
                            id: "community",
                            label: "Community Notes",
                            icon: MessageSquare,
                        },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                                activeTab === id
                                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${activeTab === id ? "opacity-100" : "opacity-70"}`} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === "courses" && (
                    <div>
                        {allCourses.length === 0 ? (
                            <div className="card bg-blue-50 border border-blue-200 border-dashed">
                                <div className="card-body text-center py-12">
                                    <BookOpen className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        You haven't joined any courses yet. Use
                                        a join code to get started!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {allCourses.map((course) => (
                                    <div
                                        key={course._id}
                                        className="glass-card group cursor-pointer"
                                    >
                                        <div className="card-body p-5">
                                            <h3 className="card-title text-lg text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-1">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                                                {course.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-slate-500">
                                                <span>
                                                    Joined{" "}
                                                    {new Date(
                                                        course.enrolledAt,
                                                    ).toLocaleDateString()}
                                                </span>
                                                <span className="badge badge-primary badge-sm shadow-sm">
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                        <div className="card-actions border-t border-slate-200 dark:border-slate-700/50 pt-4 px-5 pb-5">
                                            <div className="flex flex-col gap-2 w-full">
                                                <button
                                                    onClick={() => {
                                                        setChatCourseId(
                                                            course._id,
                                                        );
                                                        setChatPeerId(
                                                            course.teacher
                                                                ?._id ||
                                                                course.teacher,
                                                        );
                                                        setChatPeerName(
                                                            course.teacher
                                                                ?.name ||
                                                                "Teacher",
                                                        );
                                                        setIsChatOpen(true);
                                                    }}
                                                    className="btn btn-outline btn-sm gap-2 w-full text-slate-700 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                    Chat with Teacher
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setViewContentCourse(
                                                            course,
                                                        );
                                                        loadCourseContentNotes(
                                                            course._id,
                                                        );
                                                    }}
                                                    className="btn btn-ghost btn-sm gap-2 w-full hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                                >
                                                    View Content
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "quizzes" && (
                    <div>
                        {availableQuizzes.length === 0 ? (
                            <div className="card bg-yellow-50 border border-yellow-200 border-dashed">
                                <div className="card-body text-center py-12">
                                    <Zap className="w-16 h-16 text-yellow-300 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        No quizzes currently available to take.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {availableQuizzes.map((quiz) => {
                                    const isLocked = quiz.timingStatus === "upcoming";
                                    const isClosed = quiz.timingStatus === "closed";
                                    const isActive = quiz.timingStatus === "open";

                                    return (
                                        <div
                                            key={quiz._id}
                                            className={`glass-card transition-all ${isLocked ? "opacity-75" : ""}`}
                                        >
                                            <div className="card-body p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className={`card-title text-lg ${isLocked ? "text-slate-500" : "text-slate-900 dark:text-white"}`}>
                                                                {quiz.title}
                                                            </h3>
                                                            {quiz.isAttempted && (
                                                                <span className="badge badge-success badge-sm shadow-sm gap-1 pl-1">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Attempted
                                                                </span>
                                                            )}
                                                            {isLocked && (
                                                                <span className="badge badge-neutral badge-sm shadow-sm gap-1 pl-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    Upcoming
                                                                </span>
                                                            )}
                                                            {isClosed && (
                                                                <span className="badge badge-ghost badge-sm shadow-sm gap-1 pl-1 border-slate-300">
                                                                    Closed
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                                                            {quiz.description}
                                                        </p>
                                                        <div className="flex flex-wrap gap-4 text-xs font-medium">
                                                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                                                <BookMarked className="w-4 h-4 text-blue-500" />
                                                                {quiz.course?.title}
                                                            </div>
                                                            <div className={`flex items-center gap-1 ${isLocked ? "text-blue-600 dark:text-blue-400 font-bold" : isClosed ? "text-red-500" : "text-slate-500"}`}>
                                                                <Clock className="w-4 h-4" />
                                                                {isLocked 
                                                                    ? `Opens: ${new Date(quiz.openAt).toLocaleString()}` 
                                                                    : isClosed 
                                                                        ? `Closed: ${new Date(quiz.closeAt).toLocaleString()}`
                                                                        : `Closes: ${new Date(quiz.closeAt).toLocaleString()}`
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button
                                                            onClick={() => handleStartQuiz(quiz._id)}
                                                            disabled={startingQuizId === quiz._id || isLocked || isClosed}
                                                            className={`btn gap-2 ml-4 shadow-lg min-w-[140px] ${
                                                                isLocked || isClosed
                                                                    ? "btn-ghost bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border-none"
                                                                    : quiz.isAttempted
                                                                        ? "btn-outline dark:border-slate-600 dark:text-slate-300 shadow-none hover:bg-slate-50 dark:hover:bg-slate-800"
                                                                        : "btn-success shadow-success/30 text-white"
                                                            }`}
                                                        >
                                                            {startingQuizId === quiz._id ? (
                                                                <>
                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                    Starting...
                                                                </>
                                                            ) : isLocked ? (
                                                                "Locked"
                                                            ) : isClosed ? (
                                                                "Expired"
                                                            ) : (
                                                                <>
                                                                    <Zap className="w-5 h-5" />
                                                                    {quiz.isAttempted ? "Retake" : "Start Quiz"}
                                                                </>
                                                            )}
                                                        </button>
                                                        {isLocked && (
                                                            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-wider">Not yet open</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "leaderboard" && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="glass-panel overflow-hidden rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                    Course Leaderboards
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">See how you rank against your peers</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-500">Select Course:</span>
                                <select 
                                    className="select select-bordered select-sm bg-white dark:bg-base-300 rounded-xl focus:ring-2 focus:ring-yellow-500/50"
                                    value={chatCourseId || (allCourses[0]?._id || "")}
                                    onChange={(e) => setChatCourseId(e.target.value)}
                                >
                                    {allCourses.map(c => (
                                        <option key={c._id} value={c._id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {allCourses.length > 0 ? (
                            <Leaderboard courseId={chatCourseId || allCourses[0]._id} isTeacher={false} />
                        ) : (
                            <div className="text-center py-20 glass-panel border-dashed">
                                <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500">Join a course to see the leaderboard!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "grades" && (
                    <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 md:p-8">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-slate-900 dark:text-white">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                    <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                My Grade History
                            </h2>

                            {activeTab === "grades" && viewContentCourse && (
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
                )}

                {activeTab === "community" && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="glass-panel overflow-hidden rounded-2xl mb-8">
                            <div className="p-6 flex items-center gap-4 bg-purple-500/5 dark:bg-purple-500/10">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                                    <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                                        Community Notes
                                    </h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Viewing notes from all your joined courses
                                    </p>
                                </div>
                            </div>
                        </div>

                        {allNotesLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <span className="loading loading-spinner loading-lg text-purple-500"></span>
                            </div>
                        ) : allCourseNotes.length === 0 ? (
                            <div className="text-center py-16 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 border-dashed dark:border-purple-800/30">
                                <MessageSquare className="w-16 h-16 text-purple-300 dark:text-purple-700/50 mx-auto mb-4" />
                                <p className="text-slate-600 dark:text-slate-400">
                                    No notes posted yet in any of your courses.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {allCourseNotes.map((note) => (
                                    <NoteCard
                                        key={note._id}
                                        note={note}
                                        isTeacher={false}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Course Content Modal */}
            {viewContentCourse && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto w-full h-full">
                    <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8 rounded-3xl animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col">
                        {/* Modal Header */}
                        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                                    <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {viewContentCourse.title}
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                        {viewContentCourse.description}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setViewContentCourse(null);
                                    setCourseContentNotes([]);
                                }}
                                className="btn btn-ghost btn-circle text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 space-y-10 bg-slate-50/50 dark:bg-base-200/50 flex-1">
                            {/* Quizzes Section */}
                            <div>
                                <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    Course Quizzes
                                </h3>
                                {availableQuizzes.filter(
                                    (q) => q.course?._id === viewContentCourse._id,
                                ).length === 0 ? (
                                    <div className="text-center py-8 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-200 border-dashed dark:border-yellow-800/30">
                                        <p className="text-slate-600 dark:text-slate-400">
                                            No quizzes available for this course yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {availableQuizzes
                                            .filter(
                                                (q) => q.course?._id === viewContentCourse._id,
                                            )
                                            .map((quiz) => (
                                                <div
                                                    key={quiz._id}
                                                    className="glass-card"
                                                >
                                                    <div className="card-body p-5">
                                                        <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                                <h4 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">
                                                                    {quiz.title}
                                                                </h4>
                                                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    Closes{" "}
                                                                    {new Date(
                                                                        quiz.closeAt,
                                                                    ).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    handleStartQuiz(
                                                                        quiz._id,
                                                                    );
                                                                    setViewContentCourse(
                                                                        null,
                                                                    );
                                                                }}
                                                                disabled={
                                                                    startingQuizId ===
                                                                    quiz._id
                                                                }
                                                                className="btn btn-primary btn-sm shadow-sm"
                                                            >
                                                                {startingQuizId ===
                                                                quiz._id ? (
                                                                    <span className="loading loading-spinner loading-xs"></span>
                                                                ) : (
                                                                    "Start"
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>

                            {/* Notes Section */}
                            <div>
                                <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                                    <MessageSquare className="w-5 h-5 text-purple-500" />
                                    Course Notes
                                </h3>
                                {contentNotesLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="loading loading-spinner loading-lg text-blue-500"></span>
                                    </div>
                                ) : courseContentNotes.length === 0 ? (
                                    <div className="text-center py-8 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 border-dashed dark:border-purple-800/30">
                                        <p className="text-slate-600 dark:text-slate-400">
                                            No notes posted yet for this course.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {courseContentNotes.map((note) => (
                                            <NoteCard
                                                key={note._id}
                                                note={note}
                                                isTeacher={false}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isChatOpen && chatCourseId && chatPeerId && (
                <ChatWindow
                    courseId={chatCourseId}
                    peerId={chatPeerId}
                    peerName={chatPeerName}
                    onClose={() => {
                        setIsChatOpen(false);
                        setChatCourseId(null);
                        setChatPeerId(null);
                        setChatPeerName("");
                    }}
                />
            )}
        </PageWrapper>
    );
}

export default StudentPage;
