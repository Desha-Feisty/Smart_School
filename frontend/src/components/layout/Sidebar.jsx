import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../../stores/Authstore";
import useUIStore from "../../stores/uiStore";
import {
    Home,
    BookOpen,
    FileText,
    BarChart3,
    Settings,
    LogOut,
    Users,
    Trophy,
    Calendar,
    Zap,
    Shield,
} from "lucide-react";

const adminLinks = [
    { to: "/admin", icon: Shield, label: "Dashboard", id: "dashboard" },
    { to: "/admin/users", icon: Users, label: "Manage Users", id: "users" },
    { to: "/admin/analytics", icon: BarChart3, label: "Analytics", id: "analytics" },
    { to: "/admin/logs", icon: FileText, label: "Activity Logs", id: "logs" },
];

const teacherLinks = [
    { to: "/teacher", icon: Home, label: "Dashboard", id: "dashboard" },
    { to: "/teacher/courses", icon: BookOpen, label: "My Courses", id: "courses" },
    { to: "/teacher/analytics", icon: BarChart3, label: "Analytics", id: "analytics" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard", id: "leaderboard" },
];

const studentLinks = [
    { to: "/student", icon: Home, label: "Dashboard", id: "dashboard" },
    { to: "/student/courses", icon: BookOpen, label: "My Courses", id: "courses" },
    { to: "/student/quizzes", icon: Zap, label: "Quizzes", id: "quizzes" },
    { to: "/student/grades", icon: FileText, label: "Grades", id: "grades" },
    { to: "/student/calendar", icon: Calendar, label: "Calendar", id: "calendar" },
    { to: "/student/analytics", icon: BarChart3, label: "Analytics", id: "analytics" },
    { to: "/leaderboard", icon: Trophy, label: "Leaderboard", id: "leaderboard" },
];

const bottomLinks = [
    { to: "/settings", icon: Settings, label: "Settings", id: "settings" },
];

function Sidebar() {
    const navigate = useNavigate();
    const { user, role, logout, clearToken, clearUser } = useAuthStore();
    const { isSidebarOpen } = useUIStore();

    const links = role === "admin" ? adminLinks : role === "teacher" ? teacherLinks : studentLinks;

    const handleLogout = () => {
        logout();
        clearToken();
        clearUser();
        navigate("/login");
    };

    const sidebarVariants = {
        open: { width: 280, opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
        collapsed: { width: 88, opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    };

    return (
        <motion.aside
            className="sticky left-0 top-0 h-[calc(100vh-80px)] bg-white dark:bg-base-200 border-r border-slate-200 dark:border-slate-700/50 z-30 flex flex-col overflow-hidden"
            variants={sidebarVariants}
            animate={isSidebarOpen ? "open" : "collapsed"}
            initial={isSidebarOpen ? "open" : "collapsed"}
        >
            {/* Navigation Links */}
            <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
                {links.map((link) => (
                    <NavLink
                        key={link.id}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 group ${
                                isActive
                                    ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                            }`
                        }
                    >
                        <link.icon className="w-5 h-5 shrink-0" />
                        <AnimatePresence mode="wait">
                            {isSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="whitespace-nowrap overflow-hidden"
                                >
                                    {link.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-3 space-y-1 border-t border-slate-200 dark:border-slate-700/50">
                {bottomLinks.map((link) => (
                    <NavLink
                        key={link.id}
                        to={link.to}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-2xl font-medium transition-all duration-200 ${
                                isActive
                                    ? "bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white"
                            }`
                        }
                    >
                        <link.icon className="w-5 h-5 shrink-0" />
                        <AnimatePresence mode="wait">
                            {isSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="whitespace-nowrap overflow-hidden"
                                >
                                    {link.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}

                {/* User Info (Only if needed, Navbar has it too) */}
                <AnimatePresence mode="wait">
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-900 dark:text-white truncate">
                                        {user?.name || "User"}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                        {role || "Guest"}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    <AnimatePresence mode="wait">
                        {isSidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "auto" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="whitespace-nowrap overflow-hidden"
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </motion.aside>
    );
}

export default Sidebar;