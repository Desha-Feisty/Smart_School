import { LogOut, BookMarked, Bell, Check, ExternalLink, Inbox, Shield, Menu, GraduationCap, X } from "lucide-react";
import useAuthStore from "../../stores/Authstore";
import useSocketStore from "../../stores/SocketStore";
import useNotificationStore from "../../stores/NotificationStore";
import useUIStore from "../../stores/uiStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Navbar() {
    const { user, logout } = useAuthStore();
    const { isSidebarOpen, toggleSidebar } = useUIStore();
    const notifications = useNotificationStore((state) => state.notifications);
    const unreadCount = useNotificationStore((state) => state.unreadCount);
    const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
    const markAsRead = useNotificationStore((state) => state.markAsRead);
    const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
    
    const disconnectSocket = useSocketStore((state) => state.disconnect);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleLogout = () => {
        disconnectSocket();
        logout();
        navigate("/login");
    };

    return (
        <nav className="h-20 w-full bg-white dark:bg-base-300 border-b border-slate-200 dark:border-slate-700/50 z-40 flex items-center px-6 sticky top-0">
            <div className="flex items-center gap-4 flex-1">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                >
                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                        <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-bold text-xl text-slate-900 dark:text-white hidden sm:block">
                        EduFlow
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="dropdown dropdown-end relative">
                    <label
                        tabIndex={0}
                        role="button"
                        className="btn btn-ghost btn-circle relative hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <Bell className={`w-5 h-5 ${unreadCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`} />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                            </span>
                        )}
                    </label>
                    <div tabIndex={0} className="dropdown-content absolute right-0 top-full z-[100] mt-4 w-[380px] rounded-3xl bg-white dark:bg-base-300 border border-slate-200 dark:border-slate-700/50 shadow-2xl overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                Notifications
                                {unreadCount > 0 && <span className="badge badge-primary badge-sm">{unreadCount}</span>}
                            </h3>
                            {unreadCount > 0 && (
                                <button onClick={() => markAllAsRead()} className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Mark all read
                                </button>
                            )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                        <Inbox className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Your inbox is clear!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {notifications.map((n) => (
                                        <div
                                            key={n._id}
                                            onClick={() => {
                                                if (!n.read) markAsRead(n._id);
                                                const link = n.link;
                                                if (link?.startsWith("__chat__")) {
                                                    navigate(user?.role === "teacher" ? "/teacher" : "/student");
                                                } else if (link) {
                                                    navigate(link === "/student" && user?.role === "teacher" ? "/teacher" : link);
                                                }
                                            }}
                                            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${!n.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                                        >
                                            <div className="flex gap-4">
                                                <div className={`mt-1 p-2 rounded-xl ${n.type === "quiz" || n.type === "quiz-graded" ? "bg-orange-100 text-orange-600" : n.type === "note" ? "bg-emerald-100 text-emerald-600" : n.type === "chat" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                                                    {(n.type === "quiz" || n.type === "quiz-graded" || n.type === "quiz-missed") ? <BookMarked className="w-4 h-4" /> : n.type === "note" ? <ExternalLink className="w-4 h-4" /> : n.type === "chat" ? <ExternalLink className="w-4 h-4" /> : <Inbox className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-0.5">
                                                        <p className={`text-sm font-bold truncate ${!n.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>
                                                            {n.title}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{n.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name || "User"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role || "Guest"}</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-ghost btn-circle text-slate-600 dark:text-slate-300 hover:text-red-500">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
}