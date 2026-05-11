import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion"; // eslint-disable-line no-unused-vars
import useNotificationStore from "../../stores/NotificationStore";
import useThemeStore from "../../stores/ThemeStore";
import {
    Bell,
    X,
    Check,
    FileText,
    MessageSquare,
    AlertCircle,
    Calendar,
} from "lucide-react";
import { format } from "date-fns";

// Glassmorphism styles - dark mode aware
const glassStyle = (isDark) => ({
    backgroundColor: isDark ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.65)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderLeft: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: isDark ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
});

const backdropStyle = (isDark) => ({
    backgroundColor: isDark ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.35)",
    backdropFilter: "blur(8px)",
});

const iconColors = {
    quiz: { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" },
    "quiz-graded": { bg: "rgba(34, 197, 94, 0.15)", color: "#22c55e" },
    "quiz-missed": { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" },
    note: { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" },
    chat: { bg: "rgba(168, 85, 247, 0.15)", color: "#a855f7" },
    system: { bg: "rgba(100, 116, 139, 0.15)", color: "#64748b" },
};

function NotificationCenter({ isOpen, onClose }) {
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
    const { theme } = useThemeStore();
    const isDark = theme === "night";
    
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    const getIcon = (type) => {
        const icons = {
            quiz: FileText,
            "quiz-graded": FileText,
            "quiz-missed": AlertCircle,
            note: FileText,
            chat: MessageSquare,
            system: Bell,
        };
        const Icon = icons[type] || Bell;
        return <Icon style={{ width: 20, height: 20 }} />;
    };

    const getColors = (type) => iconColors[type] || iconColors.system;

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

    const handleNotificationClick = (notification) => {
        if (!notification.read) markAsRead(notification._id);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Glassmorphism Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: "fixed",
                            inset: 0,
                            ...backdropStyle(isDark),
                            zIndex: 200,
                        }}
                    />

                    {/* Glassmorphism Side Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{
                            position: "fixed",
                            right: 0,
                            top: 0,
                            height: "100%",
                            width: "100%",
                            maxWidth: 420,
                            ...glassStyle(isDark),
                            display: "flex",
                            flexDirection: "column",
                            zIndex: 250,
                        }}
                    >
                        {/* Glass Header */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "24px",
                            borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 16,
                                    background: "linear-gradient(135deg, #8b5cf6, #a855f7)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 4px 16px rgba(139, 92, 246, 0.35)",
                                }}>
                                    <Bell style={{ width: 24, height: 24, color: "white" }} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? "#f1f5f9" : "#1e293b", margin: 0 }}>
                                        Notifications
                                    </h2>
                                    {unreadCount > 0 && (
                                        <p style={{ fontSize: 14, color: isDark ? "#94a3b8" : "#64748b", margin: 0 }}>
                                            {unreadCount} unread
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                style={{
                                    padding: 10,
                                    borderRadius: 14,
                                    background: isDark ? "rgba(30, 41, 59, 0.6)" : "rgba(255, 255, 255, 0.5)",
                                    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(255, 255, 255, 0.5)",
                                    cursor: "pointer",
                                }}
                            >
                                <X style={{ width: 20, height: 20, color: isDark ? "#94a3b8" : "#64748b" }} />
                            </button>
                        </div>

                        {/* Mark all read button - glass style */}
                        {unreadCount > 0 && (
                            <div style={{ 
                                padding: "16px 24px", 
                                borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
                                background: isDark ? "rgba(139, 92, 246, 0.08)" : "rgba(139, 92, 246, 0.04)",
                            }}>
                                <button
                                    onClick={handleMarkAllRead}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "10px 18px",
                                        borderRadius: 12,
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: isDark ? "#c084fc" : "#8b5cf6",
                                        background: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.1)",
                                        border: isDark ? "1px solid rgba(139, 92, 246, 0.25)" : "1px solid rgba(139, 92, 246, 0.2)",
                                        cursor: "pointer",
                                    }}
                                >
                                    <Check style={{ width: 18, height: 18 }} />
                                    Mark all as read
                                </button>
                            </div>
                        )}

                        {/* Notifications List - glass style */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
                            {notifications.length === 0 ? (
                                <div style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "64px 24px",
                                    gap: 16,
                                }}>
                                    <div style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: "50%",
                                        background: isDark ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.1)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}>
                                        <Bell style={{ width: 36, height: 36, color: isDark ? "#a855f7" : "#a855f7" }} />
                                    </div>
                                    <p style={{ color: isDark ? "#94a3b8" : "#64748b", fontSize: 15 }}>Your inbox is empty!</p>
                                    <p style={{ color: isDark ? "#64748b" : "#94a3b8", fontSize: 13 }}>You're all caught up</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {notifications.map((notification) => {
                                        const colors = getColors(notification.type);
                                        return (
                                            <div
                                                key={notification._id}
                                                onClick={() => handleNotificationClick(notification)}
                                                style={{
                                                    display: "flex",
                                                    gap: 14,
                                                    padding: 16,
                                                    borderRadius: 16,
                                                    backgroundColor: notification.read 
                                                        ? (isDark ? "rgba(30, 41, 59, 0.3)" : "rgba(255, 255, 255, 0.4)") 
                                                        : (isDark ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.08)"),
                                                    backdropFilter: "blur(8px)",
                                                    border: notification.read 
                                                        ? (isDark ? "1px solid rgba(255, 255, 255, 0.04)" : "1px solid rgba(255, 255, 255, 0.3)") 
                                                        : (isDark ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid rgba(139, 92, 246, 0.15)"),
                                                    cursor: "pointer",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                {/* Icon with glass effect */}
                                                <div style={{
                                                    width: 44,
                                                    height: 44,
                                                    borderRadius: 14,
                                                    background: colors.bg,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                    color: colors.color,
                                                }}>
                                                    {getIcon(notification.type)}
                                                </div>
                                                
                                                {/* Content */}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "flex-start",
                                                        marginBottom: 4,
                                                    }}>
                                                        <p style={{
                                                            fontSize: 15,
                                                            fontWeight: notification.read ? 500 : 600,
                                                            color: notification.read ? (isDark ? "#94a3b8" : "#475569") : (isDark ? "#f1f5f9" : "#1e293b"),
                                                            margin: 0,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                            maxWidth: "85%",
                                                        }}>
                                                            {notification.title}
                                                        </p>
                                                        <span style={{
                                                            fontSize: 12,
                                                            color: isDark ? "#64748b" : "#94a3b8",
                                                            fontWeight: 500,
                                                            marginLeft: 8,
                                                            flexShrink: 0,
                                                        }}>
                                                            {formatTime(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p style={{
                                                        fontSize: 14,
                                                        color: isDark ? "#94a3b8" : "#64748b",
                                                        margin: 0,
                                                        lineHeight: 1.5,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        display: "-webkit-box",
                                                        WebkitLineClamp: 2,
                                                        WebkitBoxOrient: "vertical",
                                                    }}>
                                                        {notification.message}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div style={{
                                padding: "16px 24px",
                                textAlign: "center",
                                borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.06)",
                                background: isDark ? "rgba(139, 92, 246, 0.08)" : "rgba(139, 92, 246, 0.04)",
                            }}>
                                <p style={{
                                    fontSize: 11,
                                    color: isDark ? "#64748b" : "#94a3b8",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    fontWeight: 600,
                                }}>
                                    End of notifications
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default NotificationCenter;