import { useState } from "react";
import useTeacherStore from "../stores/Teacherstore";
import useAuthStore from "../stores/Authstore";
import toast from "react-hot-toast";
import { Trash2, User, Calendar } from "lucide-react";

export default function CommentItem({ comment, isTeacher, onCommentDeleted }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const user = useAuthStore((state) => state.user);
    const deleteComment = useTeacherStore((state) => state.deleteComment);

    const isCommentAuthor = user?.id === comment.user._id;
    const canDelete = isCommentAuthor || isTeacher;

    const handleDelete = async () => {
        if (!window.confirm("Delete this comment?")) return;

        setIsDeleting(true);
        try {
            await deleteComment(comment._id);
            toast.success("Comment deleted");
            if (onCommentDeleted) onCommentDeleted();
        } catch (err) {
            toast.error(err.message || "Failed to delete comment");
            setIsDeleting(false);
        }
    };

    const commentDate = new Date(comment.createdAt).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        },
    );

    return (
        <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
                {/* Avatar + Meta */}
                <div className="flex items-start gap-3 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-blue-500/20">
                        {comment.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <p className="font-bold text-sm text-slate-900 dark:text-white">
                                {comment.user?.name || "Unknown"}
                            </p>
                            {isCommentAuthor && (
                                <span className="badge badge-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0 font-semibold">
                                    You
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                            <Calendar className="w-3 h-3" />
                            {commentDate}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                            {comment.content}
                        </p>
                    </div>
                </div>

                {/* Delete Button */}
                {canDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="shrink-0 btn btn-ghost btn-xs btn-circle text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-slate-500 dark:hover:text-red-400 transition-colors mt-0.5"
                        title="Delete comment"
                    >
                        {isDeleting
                            ? <span className="loading loading-spinner loading-xs" />
                            : <Trash2 className="w-3.5 h-3.5" />
                        }
                    </button>
                )}
            </div>
        </div>
    );
}
