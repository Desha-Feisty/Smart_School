import { LogOut, BookMarked, Sun, Moon } from "lucide-react";
import useThemeStore from "../../stores/ThemeStore";
import useAuthStore from "../../stores/Authstore";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
    const { theme, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="glass-panel rounded-none sticky top-0 z-40 border-x-0 border-t-0 border-b border-slate-200/60 dark:border-slate-700/40">
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
                <div className="flex items-center gap-4">
                    <label className="swap swap-rotate btn btn-ghost btn-circle">
                        {/* this hidden checkbox controls the state */}
                        <input type="checkbox" onChange={toggleTheme} checked={theme === "night"} />
                        
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
