import { useEffect, useState } from "react";
import useTeacherStore from "../stores/Teacherstore";
import useAuthStore from "../stores/Authstore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Plus,
    Trash2,
    BookOpen,
    Users,
    ArrowRight,
    MessageSquare,
} from "lucide-react";
import PageWrapper from "../components/layout/PageWrapper";
import Navbar from "../components/layout/Navbar";
import ChatWindow from "../components/ChatWindow";

function TeacherPage() {
    const {
        allCourses,
        listMyCourses,
        createCourse,
        deleteCourse,
        recentChats,
        recentChatsLoading,
        listRecentChats,
    } = useTeacherStore();

    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const [newCourse, setNewCourse] = useState({ title: "", description: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const [chatOpen, setChatOpen] = useState(false);
    const [chatCourseId, setChatCourseId] = useState(null);
    const [chatPeerId, setChatPeerId] = useState(null);
    const [chatPeerName, setChatPeerName] = useState("");

    useEffect(() => {
        // Small delay to allow auth store to rehydrate from localStorage
        const timer = setTimeout(() => {
            listMyCourses();
            listRecentChats();
        }, 200);
        return () => clearTimeout(timer);
    }, []);

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully!");
        navigate("/login");
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        if (!newCourse.title.trim() || !newCourse.description.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            await createCourse(newCourse.title, newCourse.description);
            toast.success("Course created successfully!");
            setNewCourse({ title: "", description: "" });
            setShowForm(false);
        } catch (error) {
            toast.error(error.message || "Failed to create course");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteCourse = async (id) => {
        if (
            window.confirm(
                "Are you sure? This will delete all quizzes and enrollments.",
            )
        ) {
            try {
                await deleteCourse(id);
                toast.success("Course deleted successfully");
            } catch (error) {
                toast.error("Failed to delete course");
            }
        }
    };

    return (
        <PageWrapper>
            <Navbar />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12 animate-in fade-in duration-500 w-full relative z-10">
                {/* Header Section */}
                <div className="mb-12">
                    <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                        Teacher Dashboard
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage your courses and track student progress
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div
                        className="glass-card bg-gradient-to-br from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10 cursor-pointer group"
                        onClick={() =>
                            document
                                .getElementById("courses-section")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                })
                        }
                    >
                        <div className="card-body p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Total Courses
                                    </p>
                                    <p className="text-4xl font-bold text-slate-900 dark:text-white">
                                        {allCourses.length}
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click to view ↓
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card bg-gradient-to-br from-purple-500/10 to-pink-500/5 dark:from-purple-500/20 dark:to-pink-500/10">
                        <div className="card-body p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Active Students
                                    </p>
                                    <p className="text-4xl font-bold text-slate-900 dark:text-white">
                                        {allCourses.reduce(
                                            (sum, course) =>
                                                sum +
                                                (course.enrollmentCount || 0),
                                            0,
                                        )}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-500/10 dark:bg-purple-500/20 rounded-2xl">
                                    <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className="glass-card bg-gradient-to-br from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10 group cursor-pointer hover:shadow-lg transition-all"
                        onClick={() => setShowForm(!showForm)}
                    >
                        <div className="card-body p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        Quick Action
                                    </p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                                        Create Course
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl group-hover:scale-110 transition-transform">
                                    <Plus className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Course Form */}
                {showForm && (
                    <div className="glass-panel rounded-2xl mb-12 overflow-hidden shadow-emerald-500/5 animate-in slide-in-from-top-4 duration-300">
                        <div className="p-6 md:p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                    <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Create New Course
                                </h3>
                            </div>

                            <form
                                onSubmit={handleCreateCourse}
                                className="space-y-5"
                            >
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                            Course Title
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g., Advanced React Patterns"
                                        className="input input-bordered bg-white/50 dark:bg-base-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        value={newCourse.title}
                                        onChange={(e) =>
                                            setNewCourse({
                                                ...newCourse,
                                                title: e.target.value,
                                            })
                                        }
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                            Description
                                        </span>
                                    </label>
                                    <textarea
                                        placeholder="Describe what students will learn..."
                                        className="textarea textarea-bordered h-24 bg-white/50 dark:bg-base-300/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        value={newCourse.description}
                                        onChange={(e) =>
                                            setNewCourse({
                                                ...newCourse,
                                                description: e.target.value,
                                            })
                                        }
                                        disabled={isLoading}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn btn-success text-white shadow-lg shadow-success/20 gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-5 h-5" />
                                                Create Course
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="btn btn-ghost text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Recent Chats Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Recent Chats
                        </h3>
                    </div>

                    {recentChatsLoading ? (
                        <div className="flex justify-center p-6">
                            <span className="loading loading-spinner text-blue-500"></span>
                        </div>
                    ) : recentChats?.length === 0 ? (
                        <div className="text-slate-500 dark:text-slate-400 italic p-6 rounded-2xl bg-slate-50/50 dark:bg-base-200/50 border border-slate-200 border-dashed dark:border-slate-700 text-center">
                            No recent chats yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentChats.map((chat) => (
                                <div
                                    key={chat._id || Math.random()}
                                    className="glass-card hover:-translate-y-1 cursor-pointer"
                                    onClick={() => {
                                        setChatCourseId(chat.courseId);
                                        setChatPeerId(chat.peerId);
                                        setChatPeerName(
                                            chat.peer?.name || "Student",
                                        );
                                        setChatOpen(true);
                                    }}
                                >
                                    <div className="card-body p-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                {chat.peer?.name || "Unknown"}
                                            </h4>
                                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                                {new Date(
                                                    chat.createdAt,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3">
                                            {chat.course?.title || "Course"}
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                            {chat.isMine ? (
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    You:{" "}
                                                </span>
                                            ) : null}
                                            {chat.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Courses Grid */}
                <div id="courses-section">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                            <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Your Courses
                        </h3>
                    </div>

                    {allCourses.length === 0 ? (
                        <div className="glass-panel border-dashed p-12 text-center rounded-3xl">
                            <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                No courses yet. Start teaching by creating your
                                first course!
                            </p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="btn btn-primary shadow-lg shadow-blue-500/20 gap-2 mx-auto"
                            >
                                <Plus className="w-5 h-5" />
                                Create First Course
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allCourses.map((course) => (
                                <div
                                    key={course._id || course.id}
                                    className="glass-card group cursor-pointer overflow-hidden flex flex-col"
                                >
                                    <div
                                        className="card-body p-6 flex flex-col grow"
                                        onClick={() =>
                                            navigate(
                                                `/teacher/course/${course._id || course.id}`,
                                            )
                                        }
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="card-title text-lg text-slate-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                                                {course.title}
                                            </h4>
                                            <div className="badge badge-primary badge-sm shadow-sm ml-2 shrink-0">
                                                {course.joinCode}
                                            </div>
                                        </div>

                                        <p className="text-slate-600 dark:text-slate-400 text-sm grow line-clamp-2 mb-4">
                                            {course.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700/50 mt-auto">
                                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                                {course.enrollmentCount || 0}
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>

                                    {/* Delete Button on Hover */}
                                    <div className="px-6 pb-6 pt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCourse(
                                                    course._id || course.id,
                                                );
                                            }}
                                            className="btn btn-sm btn-outline btn-error w-full gap-2 dark:border-red-500/50 hover:bg-red-500 dark:hover:bg-red-600 text-red-500 dark:text-red-400 hover:text-white dark:hover:text-white"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete Course
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Chat Window */}
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

export default TeacherPage;
