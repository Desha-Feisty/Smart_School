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
        <div className="glass-card bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200/60 dark:border-blue-800/30 rounded-2xl p-6 mt-6">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" />
                Add Your Comment
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="textarea w-full bg-white/70 dark:bg-base-300/60 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Share your thoughts..."
                    rows="3"
                    disabled={isSubmitting}
                    maxLength={1000}
                />

                <div className="flex justify-between items-center">
                    <span className={`text-xs font-medium tabular-nums ${content.length > 900 ? 'text-orange-500 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        {content.length}/1000
                    </span>
                    <button
                        type="submit"
                        disabled={isSubmitting || !content.trim()}
                        className="btn btn-sm btn-primary gap-2 shadow-md shadow-blue-500/20 rounded-xl hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:translate-y-0"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                Posting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                Post Comment
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
