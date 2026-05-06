import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import useAuthStore from "../../stores/Authstore";
import {
    Search,
    X,
    BookOpen,
    FileText,
    ClipboardList,
    Users,
    ArrowRight,
    Clock,
    Filter,
} from "lucide-react";

function GlobalSearch({ isOpen, onClose }) {
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState({ courses: [], notes: [], quizzes: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Debounced search
    useEffect(() => {
        if (!query.trim() || !isOpen) {
            setResults({ courses: [], notes: [], quizzes: [] });
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await axios.get("/api/search", {
                    params: { q: query, type: activeFilter === "all" ? undefined : activeFilter },
                    headers: { Authorization: `Bearer ${token}` },
                });
                setResults(res.data);
            } catch (err) {
                console.error("Search error:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query, token, isOpen, activeFilter]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e) => {
        const allResults = [
            ...results.courses.map((r) => ({ ...r, type: "course" })),
            ...results.notes.map((r) => ({ ...r, type: "note" })),
            ...results.quizzes.map((r) => ({ ...r, type: "quiz" })),
        ];

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const selected = allResults[selectedIndex];
            if (selected) {
                handleSelect(selected);
            }
        } else if (e.key === "Escape") {
            onClose?.();
        }
    }, [results, selectedIndex, onClose]);

    useEffect(() => {
        if (isOpen) {
            setSelectedIndex(0);
            setQuery("");
            setResults({ courses: [], notes: [], quizzes: [] });
        }
    }, [isOpen]);

    const handleSelect = (result) => {
        onClose?.();
        if (result.type === "course") {
            navigate(`/student/course/${result._id}`);
        } else if (result.type === "note") {
            navigate(`/student/notes/${result._id}`);
        } else if (result.type === "quiz") {
            navigate(`/student/quiz/${result._id}`);
        }
    };

    const filters = [
        { id: "all", label: "All", icon: Search },
        { id: "courses", label: "Courses", icon: BookOpen },
        { id: "notes", label: "Notes", icon: FileText },
        { id: "quizzes", label: "ClipboardListzes", icon: ClipboardList },
    ];

    const allResults = activeFilter === "all"
        ? [
            ...results.courses.map((r) => ({ ...r, type: "course" })),
            ...results.notes.map((r) => ({ ...r, type: "note" })),
            ...results.quizzes.map((r) => ({ ...r, type: "quiz" })),
        ]
        : results[`${activeFilter}s`]?.map((r) => ({ ...r, type: activeFilter })) || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-base-200 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden z-50"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-700/50">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search courses, notes, quizzes..."
                                className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none text-lg"
                                autoFocus
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                >
                                    <X className="w-4 h-4 text-slate-400" />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-3 py-1.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                            >
                                ESC
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-700/50 overflow-x-auto">
                            {filters.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                        activeFilter === filter.id
                                            ? "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400"
                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                    }`}
                                >
                                    <filter.icon className="w-4 h-4" />
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        {/* Results */}
                        <div className="max-h-96 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-violet-200 dark:border-violet-700 border-t-violet-600 rounded-full animate-spin" />
                                </div>
                            ) : allResults.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
                                    <Search className="w-12 h-12 mb-3 opacity-50" />
                                    <p className="text-lg font-medium">No results found</p>
                                    <p className="text-sm">
                                        {query ? `Try searching for "${query}"` : "Start typing to search"}
                                    </p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {/* Courses */}
                                    {activeFilter === "all" && results.courses?.length > 0 && (
                                        <div className="px-6 py-2">
                                            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-2">
                                                Courses ({results.courses.length})
                                            </p>
                                        </div>
                                    )}
                                    {(activeFilter === "all" ? results.courses : activeFilter === "courses" ? results.courses : []).map((course, index) => (
                                        <button
                                            key={course._id || index}
                                            onClick={() => handleSelect({ ...course, type: "course" })}
                                            className={`w-full flex items-center gap-4 px-6 py-3 text-left transition-colors ${
                                                selectedIndex === index
                                                    ? "bg-violet-50 dark:bg-violet-500/10"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 dark:text-white truncate">
                                                    {course.title}
                                                </p>
                                                {course.description && (
                                                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                        {course.description}
                                                    </p>
                                                )}
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-slate-400" />
                                        </button>
                                    ))}

                                    {/* Notes */}
                                    {(activeFilter === "all" ? results.notes : activeFilter === "notes" ? results.notes : []).map((note, index) => (
                                        <button
                                            key={note._id || index}
                                            onClick={() => handleSelect({ ...note, type: "note" })}
                                            className={`w-full flex items-center gap-4 px-6 py-3 text-left transition-colors ${
                                                selectedIndex === (activeFilter === "all" ? results.courses.length : 0) + index
                                                    ? "bg-violet-50 dark:bg-violet-500/10"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 dark:text-white truncate">
                                                    {note.title}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                    {note.content?.slice(0, 60)}...
                                                </p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-slate-400" />
                                        </button>
                                    ))}

                                    {/* ClipboardListzes */}
                                    {(activeFilter === "all" ? results.quizzes : activeFilter === "quizzes" ? results.quizzes : []).map((quiz, index) => (
                                        <button
                                            key={quiz._id || index}
                                            onClick={() => handleSelect({ ...quiz, type: "quiz" })}
                                            className={`w-full flex items-center gap-4 px-6 py-3 text-left transition-colors ${
                                                selectedIndex === (activeFilter === "all" ? results.courses.length + results.notes.length : index)
                                                    ? "bg-violet-50 dark:bg-violet-500/10"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-700/30"
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                                                <ClipboardList className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 dark:text-white truncate">
                                                    {quiz.title}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {quiz.course?.title} • {quiz.durationMinutes} min
                                                </p>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-slate-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">↑</kbd>
                                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">↓</kbd>
                                    to navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700">↵</kbd>
                                    to select
                                </span>
                            </div>
                            <span className="flex items-center gap-1">
                                <Filter className="w-3 h-3" />
                                ESC to close
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default GlobalSearch;