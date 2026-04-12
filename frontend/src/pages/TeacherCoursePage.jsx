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
    LogOut,
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
} from "lucide-react";

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
            setEnrolledStudents(roster.enrollment || []);
            console.log("Enrolled students:", roster.enrollment || []);

            // Load grades for each student
            const gradesMap = {};
            for (const student of roster.enrollment || []) {
                try {
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
            <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate("/teacher")}
                            className="btn btn-ghost btn-circle gap-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-sm text-gray-600">
                                Managing Course
                            </p>
                            <h1 className="text-xl font-bold text-gray-900 line-clamp-1">
                                {course.title}
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
                {/* Course Header Card */}
                <div className="card bg-white shadow-lg border border-slate-200 mb-8">
                    <div className="card-body">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {course.title}
                                </h1>
                                <p className="text-gray-600 mb-4">
                                    {course.description}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="badge badge-primary gap-2">
                                        <Copy className="w-4 h-4" />
                                        {course.joinCode}
                                    </div>
                                    <button
                                        onClick={handleCopyJoinCode}
                                        className="btn btn-ghost btn-sm gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy Code
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="btn btn-ghost gap-2"
                                >
                                    <Edit className="w-5 h-5" />
                                    {isEditing ? "Cancel" : "Edit"}
                                </button>
                                <button
                                    onClick={handleDeleteCourse}
                                    className="btn btn-ghost gap-2 text-error"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* Edit Form */}
                        {isEditing && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                                <h3 className="font-bold text-lg mb-4">
                                    Edit Course Details
                                </h3>
                                <form
                                    onSubmit={handleUpdateCourse}
                                    className="space-y-4"
                                >
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">
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
                                            className="input input-bordered focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold">
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
                                            className="textarea textarea-bordered h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={isUpdatingCourse}
                                            className="btn btn-primary gap-2"
                                        >
                                            {isUpdatingCourse ? (
                                                <>
                                                    <span className="loading loading-spinner loading-xs"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="w-5 h-5" />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="btn btn-ghost"
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
                    <div className="alert alert-error mb-8">
                        <span>{quizErrMsg}</span>
                        <button
                            onClick={clearQuizErrMsg}
                            className="btn btn-ghost btn-sm"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs tabs-lifted border-b border-slate-200 mb-8">
                    {[
                        { id: "quizzes", label: "Quizzes", icon: BookOpen },
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
                            className={`tab tab-lg gap-2 font-semibold ${
                                activeTab === tabId
                                    ? "tab-active border-b-2 border-blue-600 text-blue-600"
                                    : "text-gray-600"
                            }`}
                        >
                            <Icon className="w-5 h-5" />
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
                                        className="card bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
                                    >
                                        <div className="card-body">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="card-title text-lg text-gray-900">
                                                            {quiz.title}
                                                        </h3>
                                                        {quiz.published ? (
                                                            <span className="badge badge-success gap-1">
                                                                <CheckCircle className="w-4 h-4" />
                                                                Published
                                                            </span>
                                                        ) : (
                                                            <span className="badge badge-warning">
                                                                Draft
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 text-sm mb-3">
                                                        {quiz.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            Open:{" "}
                                                            {new Date(
                                                                quiz.openAt,
                                                            ).toLocaleString()}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            Close:{" "}
                                                            {new Date(
                                                                quiz.closeAt,
                                                            ).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {!quiz.published ? (
                                                        <button
                                                            onClick={() =>
                                                                handlePublishQuiz(
                                                                    quiz._id,
                                                                )
                                                            }
                                                            className="btn btn-success btn-sm gap-2"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Publish
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                handleUnpublishQuiz(
                                                                    quiz._id,
                                                                )
                                                            }
                                                            className="btn btn-warning btn-sm gap-2"
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                            Unpublish
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `/teacher/quiz/${quiz._id}/questions`,
                                                            )
                                                        }
                                                        className="btn btn-ghost btn-sm gap-2"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Questions
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteQuiz(
                                                                quiz._id,
                                                            )
                                                        }
                                                        className="btn btn-ghost btn-sm gap-2 text-error"
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
                            <div className="card bg-white shadow-lg border border-slate-200 sticky top-20">
                                <div className="card-body">
                                    <h2 className="card-title text-lg flex items-center gap-2">
                                        <Plus className="w-5 h-5" />
                                        New Quiz
                                    </h2>
                                    <form
                                        onSubmit={handleCreateQuiz}
                                        className="space-y-4"
                                    >
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold text-sm">
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
                                                className="input input-bordered input-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Quiz title"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold text-sm">
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
                                                className="textarea textarea-bordered textarea-sm h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Description"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold text-sm">
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
                                                className="input input-bordered input-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text font-semibold text-sm">
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
                                                className="input input-bordered input-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-semibold text-xs">
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
                                                    className="input input-bordered input-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="form-control">
                                                <label className="label">
                                                    <span className="label-text font-semibold text-xs">
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
                                                    className="input input-bordered input-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isCreatingQuiz}
                                            className="btn btn-primary btn-sm w-full gap-2"
                                        >
                                            {isCreatingQuiz ? (
                                                <>
                                                    <span className="loading loading-spinner loading-xs"></span>
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />
                                                    Create Quiz
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === "students" && (
                    <div className="card bg-white shadow-lg border border-slate-200">
                        <div className="card-body">
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
                                                className="card bg-slate-50 border border-slate-200"
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
                    <div className="card bg-white shadow-lg border border-slate-200">
                        <div className="card-body">
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
                                                className={`card transition-all cursor-pointer ${
                                                    selectedQuiz === quiz._id
                                                        ? "border-blue-600 shadow-lg bg-blue-50"
                                                        : "border-slate-200 bg-white hover:shadow-md"
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
        </div>
    );
}

export default TeacherCoursePage;
