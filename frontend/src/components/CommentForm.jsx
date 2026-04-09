import { useState } from "react";
import useTeacherStore from "../stores/Teacherstore";

export default function CommentForm({ noteId, onCommentAdded }) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const addComment = useTeacherStore((state) => state.addComment);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!content.trim()) {
            setError("Comment cannot be empty");
            return;
        }

        setIsSubmitting(true);
        try {
            await addComment(noteId, { content });
            setContent("");
            if (onCommentAdded) onCommentAdded();
        } catch (err) {
            setError(err.message || "Failed to add comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg">
            {error && (
                <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a comment..."
                rows="3"
                disabled={isSubmitting}
            />

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
            >
                {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
        </form>
    );
}
