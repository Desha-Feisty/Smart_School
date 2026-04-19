import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useTeacherStore from "../stores/Teacherstore";
import useQuizStore from "../stores/Quizstore";
import useAuthStore from "../stores/Authstore";
import NoteForm from "../components/NoteForm";
import NoteCard from "../components/NoteCard";
import ChatWindow from "../components/ChatWindow";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    BookOpen,
    Award,
    MessageSquare,
    Plus,
    Eye,
    Copy,
    Users,
    UserX,
    Trophy,
    TrendingUp,
} from "lucide-react";
import PageWrapper from "../components/layout/PageWrapper";
import Navbar from "../components/layout/Navbar";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import Leaderboard from "../components/Leaderboard";

function TeacherCoursePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, logout } = useAuthStore();
    const {
        allCourses,
        updateCourse,
        deleteCourse,
        getCourse,
        getRoster,
        removeEnrollment,
    } = useTeacherStore();
    const {
        quizzes,
        createQuiz,
        listCourseQuizzes,
        deleteQuiz,
        publishQuiz,
        unpublishQuiz,
        listQuizGrades,
        quizGrades,
        gradesLoading,
        gradesError,
        errMsg: quizErrMsg,
        clearErrMsg: clearQuizErrMsg,
    } = useQuizStore();

    const [course, setCourse] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: "", description: "" });
    const [newQuiz, setNewQuiz] = useState({
        title: "",
        description: "",
        openAt: "",
        closeAt: "",
        durationMinutes: 30,
        attemptsAllowed: 1,
    });
    const [chatOpen, setChatOpen] = useState(false);
    const [chatCourseId, setChatCourseId] = useState(null);
    const [chatPeerId, setChatPeerId] = useState(null);
    const [chatPeerName, setChatPeerName] = useState("");
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [selectedQuizTitle, setSelectedQuizTitle] = useState("");
    const [activeTab, setActiveTab] = useState("quizzes");
    const [courseNotes, setCourseNotes] = useState([]);
    const [notesLoading, setNotesLoading] = useState(false);
    const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
    const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
    const [enrolledStudents, setEnrolledStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [studentGrades, setStudentGrades] = useState({});

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        const currentCourse = allCourses.find((c) => (c._id || c.id) === id);
        if (!currentCourse) {
            getCourse(id);
        }
        listCourseQuizzes(id);
    }, [id, token, navigate]);

    useEffect(() => {
        if (selectedQuiz) {
            listQuizGrades(selectedQuiz);
        }
    }, [selectedQuiz, listQuizGrades]);

    useEffect(() => {
        if (activeTab === "community") {
            loadCourseNotes();
        } else if (activeTab === "students") {
            loadEnrolledStudents();
        }
    }, [activeTab]);

    const loadCourseNotes = async () => {
        setNotesLoading(true);
        try {
            const notes = await useTeacherStore.getState().listCourseNotes(id);
            setCourseNotes(notes);
        } catch (err) {
            toast.error("Failed to load notes");
        } finally {
            setNotesLoading(false);
        }
    };

    const loadEnrolledStudents = async () => {
        setStudentsLoading(true);
        try {
            console.log("Loading enrolled students for course:", id);
            const roster = await getRoster(id);
            console.log("Roster response:", roster);
            const enrollment = roster?.enrollment || [];
            setEnrolledStudents(enrollment);
            console.log("Enrolled students:", enrollment);

            // Load grades for each student
            const gradesMap = {};
            for (const student of enrollment) {
                try {
                    if (!student?.user?._id) continue;
                    console.log(
                        "Loading grades for student:",
                        student.user._id,
                    );
                    const response = await fetch(
                        `/api/attempts/student/${student.user._id}/course/${id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        },
                    );
                    if (response.ok) {
                        const data = await response.json();
                        gradesMap[student.user._id] = data.results || [];
                        console.log(
                            "Grades for student",
                            student.user._id,
                            ":",
                            data.results || [],
                        );
                    } else {
                        console.error(
                            "Failed to load grades for student",
                            student.user._id,
                            ":",
                            response.status,
                        );
                    }
                } catch (err) {
                    console.error(
                        `Failed to load grades for student ${student.user._id}:`,
                        err,
                    );
                }
            }
            setStudentGrades(gradesMap);
        } catch (err) {
            console.error("Failed to load enrolled students:", err);
            toast.error("Failed to load enrolled students");
        } finally {
            setStudentsLoading(false);
        }
    };

    const handleRemoveStudent = async (studentId, studentName) => {
        if (
            window.confirm(
                `Remove ${studentName} from this course? They will lose access to all course materials.`,
            )
        ) {
            try {
                await removeEnrollment(id, studentId);
                toast.success("Student removed from course");
                // Reload the students list
                loadEnrolledStudents();
            } catch (err) {
                toast.error("Failed to remove student");
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {
        const currentCourse = allCourses.find((c) => (c._id || c.id) === id);
        if (currentCourse) {
            setCourse(currentCourse);
            setEditData({
                title: currentCourse.title,
                description: currentCourse.description,
            });
        }
    }, [allCourses, id]);

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        setIsUpdatingCourse(true);
        try {
            await updateCourse(id, editData.title, editData.description);
            setIsEditing(false);
            toast.success("Course updated successfully");
        } catch (err) {
            toast.error("Failed to update course");
        } finally {
            setIsUpdatingCourse(false);
        }
    };

    const handleDeleteCourse = async () => {
        if (
            window.confirm(
                "Are you sure? This will delete the entire course and all associated data.",
            )
        ) {
            try {
                await deleteCourse(id);
                toast.success("Course deleted successfully");
                navigate("/teacher");
            } catch (err) {
                toast.error("Failed to delete course");
            }
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        if (!newQuiz.title.trim()) {
            toast.error("Quiz title is required");
            return;
        }
        setIsCreatingQuiz(true);
        try {
            await createQuiz(id, newQuiz);
            setNewQuiz({
                title: "",
                description: "",
                openAt: "",
                closeAt: "",
                durationMinutes: 30,
                attemptsAllowed: 1,
            });
            toast.success("Quiz created successfully");
        } catch (err) {
            toast.error(err.message || "Failed to create quiz");
        } finally {
            setIsCreatingQuiz(false);
        }
    };

    const handlePublishQuiz = async (quizId) => {
        try {
            await publishQuiz(quizId);
            toast.success("Quiz published successfully");
        } catch (err) {
            toast.error("Failed to publish quiz");
        }
    };

    const handleUnpublishQuiz = async (quizId) => {
        try {
            await unpublishQuiz(quizId);
            toast.success("Quiz unpublished successfully");
        } catch (err) {
            toast.error("Failed to unpublish quiz");
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (
            window.confirm(
                "Delete this quiz? All student attempts will be deleted.",
            )
        ) {
            try {
                await deleteQuiz(quizId);
                toast.success("Quiz deleted successfully");
            } catch (err) {
                toast.error("Failed to delete quiz");
            }
        }
    };

    const handleCopyJoinCode = () => {
        navigator.clipboard.writeText(course.joinCode);
        toast.success("Join code copied to clipboard!");
    };

    if (!course)
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-base-300">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );

    return (
        <PageWrapper>
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 py-8 animate-in fade-in duration-500 w-full relative z-10">
                {/* Course Header Card */}
                <div className="glass-panel overflow-hidden mb-8 border border-white/40 dark:border-slate-700/50 shadow-xl shadow-blue-900/5 rounded-3xl">
                    <div className="p-8 md:p-10 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <button
                                        onClick={() => navigate("/teacher")}
                                        className="btn btn-ghost btn-sm btn-circle dark:text-slate-300"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Managing Course</p>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4 bg-clip-text">
                                    {course.title}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-2xl text-lg leading-relaxed">
                                    {course.description}
                                </p>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl border border-blue-100 dark:border-blue-800/50 font-mono font-medium shadow-sm">
                                        <Copy className="w-4 h-4 opacity-70" />
                                        <span>Join Code: </span>
                                        <span className="font-bold tracking-wider">{course.joinCode}</span>
                                    </div>
                                    <button
                                        onClick={handleCopyJoinCode}
                                        className="btn btn-ghost text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl px-4"
                                    >
                                        <Copy className="w-4 h-4 mr-2" />
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-3 md:flex-col lg:flex-row">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`btn btn-outline border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl px-6 ${isEditing ? 'bg-slate-100 dark:bg-slate-800' : 'bg-white/50 dark:bg-slate-800/30'}`}
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    {isEditing ? "Cancel Edit" : "Edit Course"}
                                </button>
                                <button
                                    onClick={handleDeleteCourse}
                                    className="btn btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300 rounded-xl px-6"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* Edit Form */}
                        {isEditing && (
                            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700/50 animate-in slide-in-from-top-4 duration-300">
                                <h3 className="font-bold text-xl mb-6 text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <Edit className="w-5 h-5 text-blue-500" />
                                    Edit Course Details
                                </h3>
                                <form
                                    onSubmit={handleUpdateCourse}
                                    className="space-y-5 max-w-3xl"
                                >
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                                Course Title
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.title}
                                            onChange={(e) =>
                                                setEditData({
                                                    ...editData,
                                                    title: e.target.value,
                                                })
                                            }
                                            className="input input-bordered bg-white/50 dark:bg-base-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all"
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                                Description
                                            </span>
                                        </label>
                                        <textarea
                                            value={editData.description}
                                            onChange={(e) =>
                                                setEditData({
                                                    ...editData,
                                                    description: e.target.value,
                                                })
                                            }
                                            className="textarea textarea-bordered h-28 bg-white/50 dark:bg-base-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-xl transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={isUpdatingCourse}
                                            className="btn btn-primary rounded-xl px-8 shadow-md shadow-blue-500/20"
                                        >
                                            {isUpdatingCourse ? (
                                                <span className="loading loading-spinner loading-sm"></span>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="btn btn-ghost rounded-xl px-6 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quiz Error Alert */}
                {quizErrMsg && (
                    <div className="alert alert-error mb-4">
                        <span>{quizErrMsg}</span>
                        <button
                            onClick={clearQuizErrMsg}
                            className="btn btn-ghost btn-sm"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Teacher Store Error Alert */}
                {useTeacherStore.getState().errMsg && (
                    <div className="alert alert-error mb-8">
                        <span>{useTeacherStore.getState().errMsg}</span>
                        <button
                            onClick={() => useTeacherStore.getState().clearErrMsg()}
                            className="btn btn-ghost btn-sm"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Modern Pill Tabs */}
                <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 bg-slate-200/50 dark:bg-base-300/50 p-1.5 rounded-2xl w-max border border-slate-200 dark:border-slate-700/50">
                    {[
                        { id: "quizzes", label: "Quizzes", icon: BookOpen },
                        { id: "analytics", label: "Analytics", icon: TrendingUp },
                        { id: "leaderboard", label: "Leaderboard", icon: Trophy },
                        { id: "students", label: "Students", icon: Users },
                        { id: "grades", label: "Student Grades", icon: Award },
                        {
                            id: "community",
                            label: "Community Notes",
                            icon: MessageSquare,
                        },
                    ].map(({ id: tabId, label, icon: Icon }) => (
                        <button
                            key={tabId}
                            onClick={() => setActiveTab(tabId)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 ${
                                activeTab === tabId
                                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md"
                                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50"
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${activeTab === tabId ? "opacity-100" : "opacity-70"}`} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Quiz Tab */}
                {activeTab === "quizzes" && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Quiz List */}
                        <div className="lg:col-span-3 space-y-4">
                            {quizzes.length === 0 ? (
                                <div className="card bg-blue-50 border border-blue-200 border-dashed">
                                    <div className="card-body text-center py-12">
                                        <BookOpen className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                                        <p className="text-gray-600">
                                            No quizzes created yet. Create one
                                            to get started!
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                quizzes.map((quiz) => (
                                    <div
                                        key={quiz._id}
                                        className="glass-card hover:-translate-y-1 transition-all overflow-hidden flex flex-col relative group"
                                    >
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 dark:bg-blue-400/50 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-colors"></div>
                                        <div className="card-body p-6 ml-1">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="card-title text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {quiz.title}
                                                        </h3>
                                                        {quiz.published ? (
                                                            <span className="badge badge-success badge-sm py-2.5 shadow-sm shadow-success/20 gap-1 text-white px-3 font-medium">
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                Published
                                                            </span>
                                                        ) : (
                                                            <span className="badge badge-warning badge-sm py-2.5 shadow-sm shadow-warning/20 gap-1 text-warning-content px-3 font-medium">
                                                                Draft
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                                                        {quiz.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                            <span>Open: <span className="text-slate-700 dark:text-slate-300">{new Date(quiz.openAt).toLocaleString()}</span></span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                            <Clock className="w-3.5 h-3.5 text-orange-500" />
                                                            <span>Close: <span className="text-slate-700 dark:text-slate-300">{new Date(quiz.closeAt).toLocaleString()}</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                                                    {!quiz.published ? (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handlePublishQuiz(quiz._id); }}
                                                            className="btn btn-success btn-sm text-white shadow-md shadow-success/20 gap-2 w-full sm:w-auto hover:-translate-y-0.5 transition-transform"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Publish
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleUnpublishQuiz(quiz._id); }}
                                                            className="btn btn-warning btn-sm text-warning-content shadow-md shadow-warning/20 gap-2 w-full sm:w-auto hover:-translate-y-0.5 transition-transform"
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                            Unpublish
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/teacher/quiz/${quiz._id}/questions`); }}
                                                        className="btn btn-outline border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 btn-sm gap-2 w-full sm:w-auto dark:text-slate-300 hover:-translate-y-0.5 transition-transform"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Questions
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz._id); }}
                                                        className="btn btn-ghost text-red-500 dark:text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 btn-sm gap-2 w-full sm:w-auto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Create Quiz Form */}
                        <div className="lg:col-span-1">
                            <div className="glass-panel overflow-hidden sticky top-24 rounded-3xl shadow-xl shadow-emerald-500/5 border border-white/40 dark:border-slate-700/50">
                                <div className="absolute top-0 w-full h-1 bg-emerald-500"></div>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                            <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                            New Quiz
                                        </h2>
                                    </div>
                                    <form
                                        onSubmit={handleCreateQuiz}
                                        className="space-y-4"
                                    >
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                                                    Title
                                                </span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={newQuiz.title}
                                                onChange={(e) =>
                                                    setNewQuiz({
                                                        ...newQuiz,
                                                        title: e.target.value,
                                                    })
                                                }
                                                className="input input-sm h-10 w-full bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl"
                                                placeholder="Quiz title"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                                                    Description
                                                </span>
                                            </label>
                                            <textarea
                                                value={newQuiz.description}
                                                onChange={(e) =>
                                                    setNewQuiz({
                                                        ...newQuiz,
                                                        description:
                                                            e.target.value,
                                                    })
                                                }
                                                className="textarea h-24 w-full bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl py-2"
                                                placeholder="Description..."
                                            />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                            <div className="form-control">
                                                <label className="label py-1">
                                                    <span className="label-text font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                        Open Date
                                                    </span>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={newQuiz.openAt}
                                                    onChange={(e) =>
                                                        setNewQuiz({
                                                            ...newQuiz,
                                                            openAt: e.target.value,
                                                        })
                                                    }
                                                    className="input input-sm h-10 w-full bg-white dark:bg-base-300 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-slate-700 dark:text-slate-300"
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label py-1">
                                                    <span className="label-text font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                        Close Date
                                                    </span>
                                                </label>
                                                <input
                                                    type="datetime-local"
                                                    required
                                                    value={newQuiz.closeAt}
                                                    onChange={(e) =>
                                                        setNewQuiz({
                                                            ...newQuiz,
                                                            closeAt: e.target.value,
                                                        })
                                                    }
                                                    className="input input-sm h-10 w-full bg-white dark:bg-base-300 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-slate-700 dark:text-slate-300"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium text-slate-700 dark:text-slate-300 text-xs">
                                                        Duration (min)
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={
                                                        newQuiz.durationMinutes
                                                    }
                                                    onChange={(e) =>
                                                        setNewQuiz({
                                                            ...newQuiz,
                                                            durationMinutes:
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                        })
                                                    }
                                                    className="input input-sm h-10 w-full bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-center"
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-medium text-slate-700 dark:text-slate-300 text-xs">
                                                        Attempts
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={
                                                        newQuiz.attemptsAllowed
                                                    }
                                                    onChange={(e) =>
                                                        setNewQuiz({
                                                            ...newQuiz,
                                                            attemptsAllowed:
                                                                parseInt(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                        })
                                                    }
                                                    className="input input-sm h-10 w-full bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-center"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isCreatingQuiz}
                                            className="btn btn-success text-white w-full shadow-lg shadow-success/20 rounded-xl h-11 mt-2 hover:-translate-y-0.5 transition-transform"
                                        >
                                            {isCreatingQuiz ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                    Creating...
                                                </>
                                            ) : (
                                                <span className="font-semibold tracking-wide flex items-center justify-center gap-2">
                                                    <Plus className="w-5 h-5" />
                                                    Create Quiz
                                                </span>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === "analytics" && (
                    <div className="animate-in fade-in duration-500">
                        <AnalyticsDashboard courseId={id} mode="teacher" />
                    </div>
                )}

                {/* Leaderboard Tab */}
                {activeTab === "leaderboard" && (
                    <div className="animate-in fade-in duration-500">
                        <Leaderboard courseId={id} isTeacher={true} />
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === "students" && (
                    <div className="glass-panel overflow-hidden rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-xl">
                        <div className="p-8">
                            <h2 className="card-title text-2xl mb-6 flex items-center gap-2">
                                <Users className="w-6 h-6 text-blue-600" />
                                Enrolled Students
                            </h2>

                            {studentsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <span className="loading loading-spinner loading-lg text-blue-600"></span>
                                </div>
                            ) : enrolledStudents.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">
                                        No students enrolled yet.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {enrolledStudents.map((enrollment) => {
                                        const student = enrollment.user;
                                        const grades =
                                            studentGrades[student._id] || [];
                                        const avgGrade =
                                            grades.length > 0
                                                ? Math.round(
                                                      grades.reduce(
                                                          (sum, g) =>
                                                              sum + g.score,
                                                          0,
                                                      ) / grades.length,
                                                  )
                                                : 0;

                                        return (
                                            <div
                                                key={enrollment._id}
                                                className="glass-card hover:-translate-y-1 transition-all"
                                            >
                                                <div className="card-body p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="avatar placeholder">
                                                                    <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
                                                                        <span className="text-sm font-bold">
                                                                            {student.name
                                                                                .charAt(
                                                                                    0,
                                                                                )
                                                                                .toUpperCase()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-semibold text-gray-900">
                                                                        {
                                                                            student.name
                                                                        }
                                                                    </h3>
                                                                    <p className="text-sm text-gray-600">
                                                                        {
                                                                            student.email
                                                                        }
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                                <div className="stat stat-sm">
                                                                    <div className="stat-title">
                                                                        Quizzes
                                                                        Taken
                                                                    </div>
                                                                    <div className="stat-value text-lg">
                                                                        {
                                                                            grades.length
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div className="stat stat-sm">
                                                                    <div className="stat-title">
                                                                        Average
                                                                        Grade
                                                                    </div>
                                                                    <div className="stat-value text-lg text-primary">
                                                                        {grades.length >
                                                                        0
                                                                            ? `${avgGrade}%`
                                                                            : "N/A"}
                                                                    </div>
                                                                </div>
                                                                <div className="stat stat-sm">
                                                                    <div className="stat-title">
                                                                        Enrolled
                                                                    </div>
                                                                    <div className="stat-value text-sm">
                                                                        {new Date(
                                                                            enrollment.createdAt,
                                                                        ).toLocaleDateString()}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {grades.length >
                                                                0 && (
                                                                <div className="mt-4">
                                                                    <h4 className="font-medium text-gray-700 mb-2">
                                                                        Recent
                                                                        Grades:
                                                                    </h4>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {grades
                                                                            .slice(
                                                                                0,
                                                                                3,
                                                                            )
                                                                            .map(
                                                                                (
                                                                                    grade,
                                                                                ) => (
                                                                                    <div
                                                                                        key={
                                                                                            grade.attemptId
                                                                                        }
                                                                                        className="badge badge-outline gap-1"
                                                                                    >
                                                                                        <span className="truncate max-w-20">
                                                                                            {
                                                                                                grade
                                                                                                    .quiz
                                                                                                    .title
                                                                                            }
                                                                                        </span>
                                                                                        <span className="font-bold">
                                                                                            {
                                                                                                grade.score
                                                                                            }

                                                                                            %
                                                                                        </span>
                                                                                    </div>
                                                                                ),
                                                                            )}
                                                                        {grades.length >
                                                                            3 && (
                                                                            <div className="badge badge-ghost">
                                                                                +
                                                                                {grades.length -
                                                                                    3}{" "}
                                                                                more
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col gap-2 ml-4">
                                                            <button
                                                                onClick={() => {
                                                                    setChatCourseId(
                                                                        id,
                                                                    );
                                                                    setChatPeerId(
                                                                        student._id,
                                                                    );
                                                                    setChatPeerName(
                                                                        student.name,
                                                                    );
                                                                    setChatOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="btn btn-outline btn-sm gap-2 w-full"
                                                            >
                                                                <MessageSquare className="w-4 h-4" />
                                                                Chat
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleRemoveStudent(
                                                                        student._id,
                                                                        student.name,
                                                                    )
                                                                }
                                                                className="btn btn-ghost btn-sm text-error gap-2 w-full"
                                                            >
                                                                <UserX className="w-4 h-4" />
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Grades Tab */}
                {activeTab === "grades" && (
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
                                                    setSelectedQuizTitle(
                                                        quiz.title,
                                                    );
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
                                                        No graded submissions
                                                        found yet.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="table table-zebra w-full">
                                                        <thead className="bg-slate-50">
                                                            <tr>
                                                                <th className="text-gray-700 font-semibold">
                                                                    Name
                                                                </th>
                                                                <th className="text-gray-700 font-semibold">
                                                                    Email
                                                                </th>
                                                                <th className="text-gray-700 font-semibold">
                                                                    Score
                                                                </th>
                                                                <th className="text-gray-700 font-semibold">
                                                                    Submitted
                                                                </th>
                                                                <th className="text-gray-700 font-semibold">
                                                                    Status
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {quizGrades.map(
                                                                (grade) => (
                                                                    <tr
                                                                        key={
                                                                            grade.attemptId
                                                                        }
                                                                    >
                                                                        <td className="font-medium">
                                                                            {grade
                                                                                .student
                                                                                ?.name ||
                                                                                "Unknown"}
                                                                        </td>
                                                                        <td className="text-gray-600">
                                                                            {grade
                                                                                .student
                                                                                ?.email ||
                                                                                "-"}
                                                                        </td>
                                                                        <td className="font-bold text-lg">
                                                                            {
                                                                                grade.score
                                                                            }
                                                                            %
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
                                                                                {
                                                                                    grade.status
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
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
                )}

                {/* Community Notes Tab */}
                {activeTab === "community" && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1">
                            <div className="sticky top-20">
                                <NoteForm
                                    courseId={id}
                                    onNoteCreated={loadCourseNotes}
                                />
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <MessageSquare className="w-6 h-6 text-purple-600" />
                                Course Notes
                            </h2>

                            {notesLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <span className="loading loading-spinner loading-lg text-blue-600"></span>
                                </div>
                            ) : courseNotes.length === 0 ? (
                                <div className="card bg-purple-50 border border-purple-200 border-dashed">
                                    <div className="card-body text-center py-12">
                                        <MessageSquare className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                                        <p className="text-gray-600">
                                            No notes posted yet. Create one to
                                            engage with students!
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {courseNotes.map((note) => (
                                        <NoteCard
                                            key={note._id}
                                            note={note}
                                            isTeacher={true}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
            {chatOpen && chatCourseId && chatPeerId && (
                <ChatWindow
                    courseId={chatCourseId}
                    peerId={chatPeerId}
                    peerName={chatPeerName}
                    onClose={() => {
                        setChatOpen(false);
                        setChatCourseId(null);
                        setChatPeerId(null);
                        setChatPeerName("");
                    }}
                />
            )}
        </PageWrapper>
    );
}

export default TeacherCoursePage;
