import { useState } from "react";
import useTeacherStore from "../stores/Teacherstore";
import useAuthStore from "../stores/Authstore";

export default function CommentItem({ comment, isTeacher, onCommentDeleted }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState("");
    const user = useAuthStore((state) => state.user);
    const deleteComment = useTeacherStore((state) => state.deleteComment);

    const isCommentAuthor = user?.id === comment.user._id;
    const canDelete = isCommentAuthor || isTeacher;

    const handleDelete = async () => {
        if (!window.confirm("Delete this comment?")) return;

        setError("");
        setIsDeleting(true);
        try {
            await deleteComment(comment._id);
            if (onCommentDeleted) onCommentDeleted();
        } catch (err) {
            setError(err.message || "Failed to delete comment");
            setIsDeleting(false);
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <p className="font-medium text-gray-900">
                        {comment.user?.name || "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                </div>
                {canDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:text-gray-400"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            <p className="text-gray-700">{comment.content}</p>
        </div>
    );
}
