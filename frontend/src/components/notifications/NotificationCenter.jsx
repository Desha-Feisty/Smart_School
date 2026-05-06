import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useNotificationStore from "../../stores/NotificationStore";
import {
    Bell,
    X,
    Check,
    CheckCheck,
    ChevronRight,
    FileText,
    ClipboardList,
    MessageSquare,
    AlertCircle,
    Calendar,
    Trash2,
} from "lucide-react";
import { format } from "date-fns";

function NotificationCenter({ isOpen, onClose }) {
    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotificationStore();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    const getIcon = (type) => {
        const icons = {
            quiz: ClipboardList,
            "quiz-graded": FileText,
            "quiz-missed": AlertCircle,
            note: FileText,
            chat: MessageSquare,
            system: Bell,
        };
        const Icon = icons[type] || Bell;
        return <Icon className="w-5 h-5" />;
    };

    const getColors = (type) => {
        const colors = {
            quiz: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400",
            "quiz-graded": "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400",
            "quiz-missed": "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400",
            note: "bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400",
            chat: "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400",
            system: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
        };
        return colors[type] || colors.system;
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllAsRead();
        } catch (err) {
            console.error("Failed to mark all as read:", err);
        }
    };

    const formatTime = (date) => {
        try {
            const d = new Date(date);
            const now = new Date();
            const diff = now.getTime() - d.getTime();
            const mins = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (mins < 1) return "Just now";
            if (mins < 60) return `${mins}m ago`;
            if (hours < 24) return `${hours}h ago`;
            if (days < 7) return `${days}d ago`;
            return format(d, "MMM d");
        } catch {
            return "";
        }
    };

    const groupedNotifications = notifications.reduce((acc, notification) => {
        const date = format(new Date(notification.createdAt), "yyyy-MM-dd");
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(notification);
        return acc;
    }, {});

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-base-200 shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                        Notifications
                                    </h2>
                                    {unreadCount > 0 && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {unreadCount} unread
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Actions */}
                        {unreadCount > 0 && (
                            <div className="flex items-center gap-2 px-6 py-3 border-b border-slate-200 dark:border-slate-700/50">
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark all read
                                </button>
                            </div>
                        )}

                        {/* Notifications List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-violet-200 dark:border-violet-700 border-t-violet-600 rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-500 dark:text-slate-400">
                                    <Bell className="w-16 h-16 mb-4 opacity-30" />
                                    <p className="text-lg font-medium">No notifications</p>
                                    <p className="text-sm">You're all caught up!</p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {Object.entries(groupedNotifications).map(([date, items]) => (
                                        <div key={date}>
                                            {/* Date Header */}
                                            <div className="px-6 py-2">
                                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase">
                                                    {format(new Date(date), "EEEE, MMMM d")}
                                                </p>
                                            </div>

                                            {/* Notifications */}
                                            {items.map((notification) => (
                                                <motion.div
                                                    key={notification._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`relative px-6 py-4 border-b border-slate-100 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer ${
                                                        !notification.read
                                                            ? "bg-violet-50/50 dark:bg-violet-500/5"
                                                            : ""
                                                    }`}
                                                    onClick={() => markAsRead(notification._id)}
                                                >
                                                    {!notification.read && (
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-violet-500" />
                                                    )}

                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getColors(notification.type)}`}>
                                                            {getIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium text-slate-900 dark:text-white ${
                                                                !notification.read ? "font-semibold" : ""
                                                            }`}>
                                                                {notification.title}
                                                            </p>
                                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                                                                {notification.message}
                                                            </p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                                                {formatTime(notification.createdAt)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification._id);
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Empty State Action */}
                        {notifications.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700/50">
                                <button
                                    onClick={onClose}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    View all notifications
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default NotificationCenter;