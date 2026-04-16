import { useEffect, useState } from "react";
import useTeacherStore from "../stores/Teacherstore";
import useAuthStore from "../stores/Authstore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    LogOut,
    Plus,
    Trash2,
    BookOpen,
    Users,
    ArrowRight,
    MessageSquare,
} from "lucide-react";
import ChatWindow from "../components/ChatWindow";

function TeacherPage() {
    const { allCourses, listMyCourses, createCourse, deleteCourse, recentChats, recentChatsLoading, listRecentChats } =
        useTeacherStore();

    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const [newCourse, setNewCourse] = useState({ title: "", description: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    
    const [chatOpen, setChatOpen] = useState(false);
    const [chatCourseId, setChatCourseId] = useState(null);
    const [chatPeerId, setChatPeerId] = useState(null);
    const [chatPeerName, setChatPeerName] = useState("");

    useEffect(() => {
        listMyCourses();
        listRecentChats();
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
        <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            LearnHub
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-600">
                                Welcome back,
                            </p>
                            <p className="font-semibold text-gray-900">
                                {user?.name}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="btn btn-ghost gap-2"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">
                        Teacher Dashboard
                    </h2>
                    <p className="text-gray-600">
                        Manage your courses and track student progress
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="card bg-white shadow-md border border-slate-200">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">
                                        Total Courses
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {allCourses.length}
                                    </p>
                                </div>
                                <BookOpen className="w-12 h-12 text-blue-100" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-white shadow-md border border-slate-200">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 text-sm">
                                        Active Students
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {allCourses.reduce(
                                            (sum, course) =>
                                                sum +
                                                (course.enrollmentCount || 0),
                                            0,
                                        )}
                                    </p>
                                </div>
                                <Users className="w-12 h-12 text-purple-100" />
                            </div>
                        </div>
                    </div>

                    <div className="card bg-white shadow-md border border-slate-200">
                        <div className="card-body">
                            <div
                                onClick={() => setShowForm(!showForm)}
                                className="cursor-pointer flex items-center justify-between hover:scale-105 transition"
                            >
                                <div>
                                    <p className="text-gray-600 text-sm">
                                        Quick Action
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        Create Course
                                    </p>
                                </div>
                                <Plus className="w-8 h-8 text-green-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Create Course Form */}
                {showForm && (
                    <div className="card bg-white shadow-lg border border-slate-200 mb-12">
                        <div className="card-body">
                            <h3 className="card-title text-xl mb-4">
                                Create New Course
                            </h3>

                            <form
                                onSubmit={handleCreateCourse}
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
                                        placeholder="e.g., Advanced React Patterns"
                                        className="input input-bordered focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                        <span className="label-text font-semibold">
                                            Description
                                        </span>
                                    </label>
                                    <textarea
                                        placeholder="Describe what students will learn..."
                                        className="textarea textarea-bordered h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="btn btn-primary gap-2"
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
                                        className="btn btn-ghost"
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
                    <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                        Recent Chats
                    </h3>

                    {recentChatsLoading ? (
                        <div className="flex justify-center p-6"><span className="loading loading-spinner text-blue-600"></span></div>
                    ) : recentChats?.length === 0 ? (
                        <div className="text-gray-500 italic p-4 bg-white rounded-xl shadow-sm border border-slate-200 text-center">No recent chats yet.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentChats.map((chat) => (
                                <div
                                    key={chat._id || Math.random()}
                                    className="card bg-white shadow-sm hover:shadow-md border border-slate-200 transition-all cursor-pointer"
                                    onClick={() => {
                                        setChatCourseId(chat.course?._id || chat.course);
                                        setChatPeerId(chat.peer?._id || chat.peer);
                                        setChatPeerName(chat.peer?.name || "Student");
                                        setChatOpen(true);
                                    }}
                                >
                                    <div className="card-body p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-gray-900">{chat.peer?.name || "Unknown"}</h4>
                                            <span className="text-xs text-gray-400">
                                                {new Date(chat.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-xs text-blue-600 font-medium mb-2">
                                            {chat.course?.title || "Course"}
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-1">
                                            {chat.sender && (chat.sender._id || chat.sender) === (user?._id || user?.id) ? "You: " : ""} {chat.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Courses Grid */}
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                        Your Courses
                    </h3>

                    {allCourses.length === 0 ? (
                        <div className="card bg-white shadow-md border border-dashed border-slate-300">
                            <div className="card-body text-center py-12">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">
                                    No courses yet. Start teaching by creating
                                    your first course!
                                </p>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="btn btn-primary gap-2 mx-auto"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create First Course
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allCourses.map((course) => (
                                <div
                                    key={course._id || course.id}
                                    className="card bg-white shadow-md hover:shadow-lg border border-slate-200 transition-all hover:border-blue-300 group cursor-pointer overflow-hidden"
                                >
                                    <div
                                        className="card-body flex flex-col h-full"
                                        onClick={() =>
                                            navigate(
                                                `/teacher/course/${course._id || course.id}`,
                                            )
                                        }
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="card-title text-lg text-gray-900 group-hover:text-blue-600 transition">
                                                {course.title}
                                            </h4>
                                            <div className="badge badge-primary">
                                                {course.joinCode}
                                            </div>
                                        </div>

                                        <p className="text-gray-600 text-sm grow line-clamp-2 mb-4">
                                            {course.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                                            <div className="text-sm text-gray-500">
                                                <Users className="w-4 h-4 inline mr-1" />
                                                {course.enrollmentCount || 0}{" "}
                                                students
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition" />
                                        </div>
                                    </div>

                                    {/* Delete Button on Hover */}
                                    <div className="card-actions p-4 bg-red-50 border-t border-red-200 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteCourse(
                                                    course._id || course.id,
                                                );
                                            }}
                                            className="btn btn-sm btn-outline btn-error gap-1 w-full"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
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
        </div>
    );
}

export default TeacherPage;
