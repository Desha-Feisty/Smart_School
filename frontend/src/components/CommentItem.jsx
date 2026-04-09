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
        <div className="card bg-white border border-slate-200 shadow-sm">
            <div className="card-body">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="avatar placeholder">
                            <div className="bg-blue-500 text-white rounded-full w-8">
                                <span className="text-xs font-bold">
                                    {comment.user?.name
                                        ?.charAt(0)
                                        .toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">
                                {comment.user?.name || "Unknown"}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {commentDate}
                            </div>
                        </div>
                        {isCommentAuthor && (
                            <div className="badge badge-sm badge-ghost ml-auto">
                                You
                            </div>
                        )}
                    </div>

                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Delete comment"
                        >
                            <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                    )}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed">
                    {comment.content}
                </p>
            </div>
        </div>
    );
}
