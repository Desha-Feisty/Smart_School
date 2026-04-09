import { useState } from "react";
import useTeacherStore from "../stores/Teacherstore";
import toast from "react-hot-toast";
import { Send } from "lucide-react";

export default function CommentForm({ noteId, onCommentAdded }) {
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addComment = useTeacherStore((state) => state.addComment);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim()) {
            toast.error("Comment cannot be empty");
            return;
        }

        setIsSubmitting(true);
        try {
            await addComment(noteId, { content });
            toast.success("Comment added!");
            setContent("");
            if (onCommentAdded) onCommentAdded();
        } catch (err) {
            toast.error(err.message || "Failed to add comment");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card bg-blue-50 border border-blue-200 mt-8">
            <div className="card-body">
                <h4 className="card-title text-base mb-4">Add Your Comment</h4>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="textarea textarea-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Share your thoughts..."
                        rows="3"
                        disabled={isSubmitting}
                        maxLength={1000}
                    />

                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                            {content.length}/1000
                        </span>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-sm btn-primary gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    Posting...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Comment
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
