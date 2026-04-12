import { useEffect, useState, useCallback } from "react";
import useAuthStore from "../stores/Authstore";
import useTeacherStore from "../stores/Teacherstore";
import useQuizStore from "../stores/Quizstore";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NoteCard from "../components/NoteCard";
import ChatWindow from "../components/ChatWindow";
import toast from "react-hot-toast";
import {
    LogOut,
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
    } = useQuizStore();
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState("");
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
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

    const fetchAvailableQuizzes = useCallback(async () => {
        try {
            const response = await axios.get("/api/quizzes/available", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAvailableQuizzes(response.data.quizzes || []);
        } catch (err) {
            console.error("Failed to fetch quizzes", err);
        }
    }, [token]);

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
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-linear-to-br from-blue-600 to-purple-600 rounded-lg p-2">
                            <BookMarked className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">
                                Welcome back
                            </p>
                            <h1 className="text-xl font-bold text-gray-900">
                                {user?.name}
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card bg-white shadow-lg border border-slate-200">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                        My Courses
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {allCourses.length}
                                    </p>
                                </div>
                                <BookOpen className="w-12 h-12 text-blue-500 opacity-20" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-white shadow-lg border border-slate-200">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                        Quizzes Available
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {availableQuizzes.length}
                                    </p>
                                </div>
                                <Zap className="w-12 h-12 text-yellow-500 opacity-20" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-white shadow-lg border border-slate-200">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">
                                        Average Score
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {avgScore}%
                                    </p>
                                </div>
                                <Award className="w-12 h-12 text-green-500 opacity-20" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Join Course Section */}
                <div className="card bg-white shadow-lg border border-slate-200 mb-8">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-blue-600" />
                            Join a New Course
                        </h2>
                        <form
                            onSubmit={handleJoinCourse}
                            className="flex gap-3"
                        >
                            <input
                                type="text"
                                placeholder="Enter join code..."
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                className="input input-bordered flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Joining...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5" />
                                        Join Course
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs tabs-lifted border-b border-slate-200 mb-8">
                    {[
                        { id: "courses", label: "My Courses", icon: BookOpen },
                        {
                            id: "quizzes",
                            label: "Available Quizzes",
                            icon: Zap,
                        },
                        { id: "grades", label: "My Grades", icon: TrendingUp },
                        {
                            id: "community",
                            label: "Community Notes",
                            icon: MessageSquare,
                        },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`tab tab-lg gap-2 font-semibold ${
                                activeTab === id
                                    ? "tab-active border-b-2 border-blue-600 text-blue-600"
                                    : "text-gray-600"
                            }`}
                        >
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
                                        className="card bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-shadow group cursor-pointer"
                                    >
                                        <div className="card-body">
                                            <h3 className="card-title text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                {course.description}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>
                                                    Joined{" "}
                                                    {new Date(
                                                        course.enrolledAt,
                                                    ).toLocaleDateString()}
                                                </span>
                                                <span className="badge badge-primary">
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                        <div className="card-actions border-t border-slate-200 pt-4 px-6 pb-6">
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
                                                    className="btn btn-outline btn-sm gap-2 w-full"
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
                                                    className="btn btn-ghost btn-sm gap-2 group-hover:btn-primary w-full"
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
                                {availableQuizzes.map((quiz) => (
                                    <div
                                        key={quiz._id}
                                        className="card bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
                                    >
                                        <div className="card-body">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="card-title text-lg text-gray-900">
                                                            {quiz.title}
                                                        </h3>
                                                        {quiz.isAttempted && (
                                                            <span className="badge badge-success gap-2">
                                                                <span className="text-xs">
                                                                    ✓
                                                                </span>
                                                                Attempted
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 text-sm mb-3">
                                                        {quiz.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <BookOpen className="w-4 h-4" />
                                                            {quiz.course?.title}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            Ends{" "}
                                                            {new Date(
                                                                quiz.closeAt,
                                                            ).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        handleStartQuiz(
                                                            quiz._id,
                                                        )
                                                    }
                                                    disabled={
                                                        startingQuizId ===
                                                        quiz._id
                                                    }
                                                    className={`btn gap-2 ml-4 ${
                                                        quiz.isAttempted
                                                            ? "btn-outline"
                                                            : "btn-success"
                                                    }`}
                                                >
                                                    {startingQuizId ===
                                                    quiz._id ? (
                                                        <>
                                                            <span className="loading loading-spinner loading-xs"></span>
                                                            Starting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Zap className="w-5 h-5" />
                                                            {quiz.isAttempted
                                                                ? "Retake"
                                                                : "Start Quiz"}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "grades" && (
                    <div className="card bg-white shadow-lg border border-slate-200">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-6 flex items-center gap-2">
                                <Award className="w-6 h-6 text-blue-600" />
                                My Grade History
                            </h2>

                            {gradesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <span className="loading loading-spinner loading-lg text-blue-600"></span>
                                </div>
                            ) : gradesError ? (
                                <div className="alert alert-error">
                                    <span>{gradesError}</span>
                                </div>
                            ) : myGrades.length === 0 ? (
                                <div className="text-center py-12">
                                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">
                                        No graded attempts available yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead className="bg-slate-50">
                                            <tr>
                                                <th className="text-gray-700 font-semibold">
                                                    Quiz
                                                </th>
                                                <th className="text-gray-700 font-semibold">
                                                    Course
                                                </th>
                                                <th className="text-gray-700 font-semibold">
                                                    Score
                                                </th>
                                                <th className="text-gray-700 font-semibold">
                                                    Date
                                                </th>
                                                <th className="text-gray-700 font-semibold">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myGrades.map((grade) => (
                                                <tr key={grade.attemptId}>
                                                    <td className="font-medium text-gray-900">
                                                        {grade.quiz?.title ||
                                                            "Unnamed Quiz"}
                                                    </td>
                                                    <td className="text-gray-600">
                                                        {grade.course?.title ||
                                                            "Unknown Course"}
                                                    </td>
                                                    <td className="font-bold text-lg text-gray-900">
                                                        {grade.score}%
                                                    </td>
                                                    <td className="text-gray-600">
                                                        {grade.submittedAt
                                                            ? new Date(
                                                                  grade.submittedAt,
                                                              ).toLocaleString()
                                                            : "-"}
                                                    </td>
                                                    <td>
                                                        <span
                                                            className={`badge ${
                                                                grade.status ===
                                                                "graded"
                                                                    ? "badge-success"
                                                                    : grade.status ===
                                                                        "late"
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
                    </div>
                )}

                {activeTab === "community" && (
                    <div>
                        <div className="card bg-white shadow-lg border border-slate-200 mb-8">
                            <div className="card-body">
                                <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-6 h-6 text-purple-600" />
                                    All Community Notes
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Viewing notes from all your joined courses
                                </p>
                            </div>
                        </div>

                        {allNotesLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <span className="loading loading-spinner loading-lg text-blue-600"></span>
                            </div>
                        ) : allCourseNotes.length === 0 ? (
                            <div className="card bg-purple-50 border border-purple-200 border-dashed">
                                <div className="card-body text-center py-12">
                                    <MessageSquare className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                                    <p className="text-gray-600">
                                        No notes posted yet in any of your
                                        courses.
                                    </p>
                                </div>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-linear-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <BookOpen className="w-6 h-6" />
                                    {viewContentCourse.title}
                                </h2>
                                <p className="text-blue-100 mt-1">
                                    {viewContentCourse.description}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setViewContentCourse(null);
                                    setCourseContentNotes([]);
                                }}
                                className="btn btn-ghost btn-circle text-white hover:bg-white hover:bg-opacity-20"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Quizzes Section */}
                            <div>
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-600" />
                                    Course Quizzes
                                </h3>
                                {availableQuizzes.filter(
                                    (q) =>
                                        q.course?._id === viewContentCourse._id,
                                ).length === 0 ? (
                                    <div className="card bg-yellow-50 border border-yellow-200">
                                        <div className="card-body text-center py-8">
                                            <p className="text-gray-600">
                                                No quizzes available for this
                                                course yet.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {availableQuizzes
                                            .filter(
                                                (q) =>
                                                    q.course?._id ===
                                                    viewContentCourse._id,
                                            )
                                            .map((quiz) => (
                                                <div
                                                    key={quiz._id}
                                                    className="card bg-white border border-slate-200 hover:shadow-lg transition-shadow"
                                                >
                                                    <div className="card-body p-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-900 mb-1">
                                                                    {quiz.title}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 mb-2">
                                                                    {
                                                                        quiz.description
                                                                    }
                                                                </p>
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    <Clock className="w-4 h-4" />
                                                                    Closes{" "}
                                                                    {new Date(
                                                                        quiz.closeAt,
                                                                    ).toLocaleString()}
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
                                                                className="btn btn-success btn-sm gap-2 ml-4"
                                                            >
                                                                {startingQuizId ===
                                                                quiz._id ? (
                                                                    <>
                                                                        <span className="loading loading-spinner loading-xs"></span>
                                                                        Starting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Zap className="w-4 h-4" />
                                                                        Start
                                                                    </>
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
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-purple-600" />
                                    Course Notes
                                </h3>
                                {contentNotesLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <span className="loading loading-spinner loading-lg text-blue-600"></span>
                                    </div>
                                ) : courseContentNotes.length === 0 ? (
                                    <div className="card bg-purple-50 border border-purple-200">
                                        <div className="card-body text-center py-8">
                                            <p className="text-gray-600">
                                                No notes posted yet for this
                                                course.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
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
        </div>
    );
}

export default StudentPage;
