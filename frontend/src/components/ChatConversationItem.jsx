import { X } from "lucide-react";

function ChatConversationItem({
    conversation,
    isSelected,
    onSelect,
    onRemove,
}) {
    const { peerName, courseName, lastMessage, unreadCount } = conversation;

    return (
        <div
            className={`p-4 rounded-xl border-l-4 cursor-pointer transition-all duration-200 flex items-start justify-between gap-3 ${
                isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-md"
                    : "bg-white dark:bg-base-300/30 border-slate-200 dark:border-slate-600/50 hover:bg-slate-50 dark:hover:bg-base-300/50"
            }`}
            onClick={onSelect}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {peerName}
                    </h3>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full flex-shrink-0">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {courseName}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 truncate line-clamp-2">
                    {lastMessage || "No messages yet"}
                </p>
            </div>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                }}
                className="btn btn-ghost btn-circle btn-xs text-slate-400 hover:text-red-500 flex-shrink-0"
                title="Remove conversation"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default ChatConversationItem;
