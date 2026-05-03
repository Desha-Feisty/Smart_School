import {
    LogOut,
    BookMarked,
    Sun,
    Moon,
    Bell,
    Check,
    ExternalLink,
    Inbox,
    Shield,
} from "lucide-react";
import useThemeStore from "../../stores/ThemeStore";
import useAuthStore from "../../stores/Authstore";
import useSocketStore from "../../stores/SocketStore";
import useNotificationStore from "../../stores/NotificationStore";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Navbar() {
    const { theme, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotificationStore();
    const disconnectSocket = useSocketStore((state) => state.disconnect);
    const navigate = useNavigate();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleLogout = () => {
        disconnectSocket();
        logout();
        navigate("/login");
    };

    return (
        <nav className="sticky top-0 z-40 w-full bg-white/92 dark:bg-base-300/60 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/40 shadow-xl shadow-slate-200/80 dark:shadow-black/20">
            <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-linear-to-br from-blue-600 to-purple-600 rounded-xl p-2.5 shadow-lg shadow-blue-500/20">
                        <BookMarked className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                            Welcome back
                        </p>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                            {user?.name || "User"}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Notification Dropdown */}
                    <div className="dropdown dropdown-end relative">
                        <label
                            tabIndex={0}
                            className="btn btn-ghost btn-circle relative hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Bell
                                className={`w-5 h-5 ${unreadCount > 0 ? "text-blue-600 dark:text-blue-400" : "text-slate-500"}`}
                            />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white dark:border-slate-900"></span>
                                </span>
                            )}
                        </label>
                        <div
                            tabIndex={0}
                            className="dropdown-content absolute right-0 top-full z-[100] mt-4 w-[380px] rounded-3xl bg-white/95 dark:bg-base-300/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/50 shadow-2xl overflow-hidden transform transition-all scale-100 origin-top-right"
                        >
                            <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-white/50 dark:bg-base-300/50 backdrop-blur-md">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="badge badge-primary badge-sm">
                                            {unreadCount}
                                        </span>
                                    )}
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllAsRead()}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                    >
                                        <Check className="w-3 h-3" />
                                        Mark all as read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                            <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                                            Your inbox is clear!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {notifications.map((n) => (
                                            <div
                                                key={n._id}
                                                onClick={() => {
                                                    if (!n.read)
                                                        markAsRead(n._id);
                                                    let link = n.link;
                                                    if (
                                                        link === "/student" &&
                                                        user?.role === "teacher"
                                                    ) {
                                                        link = "/teacher";
                                                    }
                                                    if (link) navigate(link);
                                                }}
                                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group relative ${!n.read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                                            >
                                                {!n.read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                                )}
                                                <div className="flex gap-4">
                                                    <div
                                                        className={`mt-1 p-2 rounded-xl shrink-0 ${
                                                            n.type === "quiz"
                                                                ? "bg-orange-100 text-orange-600"
                                                                : n.type ===
                                                                    "note"
                                                                  ? "bg-emerald-100 text-emerald-600"
                                                                  : "bg-blue-100 text-blue-600"
                                                        }`}
                                                    >
                                                        {n.type === "quiz" ? (
                                                            <BookMarked className="w-4 h-4" />
                                                        ) : n.type ===
                                                          "note" ? (
                                                            <ExternalLink className="w-4 h-4" />
                                                        ) : (
                                                            <Inbox className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-0.5">
                                                            <p
                                                                className={`text-sm font-bold truncate ${!n.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}
                                                            >
                                                                {n.title}
                                                            </p>
                                                            <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                                                                {new Date(
                                                                    n.createdAt,
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                            {n.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 bg-slate-50/50 dark:bg-slate-800/30 text-center border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                                        End of notifications
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {user?.role === "admin" && (
                        <button
                            onClick={() => navigate("/admin")}
                            className="btn btn-primary btn-sm rounded-xl px-4 hidden md:flex"
                        >
                            <Shield className="w-4 h-4 mr-2" />
                            Admin Dashboard
                        </button>
                    )}

                    <label className="swap swap-rotate btn btn-ghost btn-circle">
                        {/* this hidden checkbox controls the state */}
                        <input
                            type="checkbox"
                            onChange={toggleTheme}
                            checked={theme === "night"}
                        />

                        {/* sun icon */}
                        <Sun className="swap-off w-5 h-5 text-yellow-500" />

                        {/* moon icon */}
                        <Moon className="swap-on w-5 h-5 text-blue-300" />
                    </label>

                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost btn-sm gap-2 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
