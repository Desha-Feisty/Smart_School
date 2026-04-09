import { useState } from "react";
import useTeacherStore from "../stores/Teacherstore";
import toast from "react-hot-toast";
import { Send, Type, FileText } from "lucide-react";

export default function NoteForm({ courseId, onNoteCreated }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createNote = useTeacherStore((state) => state.createNote);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error("Please fill in all fields");
            return;
        }

        if (content.length < 10) {
            toast.error("Content must be at least 10 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            await createNote(courseId, { title, content });
            toast.success("Note posted successfully!");
            setTitle("");
            setContent("");
            if (onNoteCreated) onNoteCreated();
        } catch (err) {
            toast.error(err.message || "Failed to create note");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="card bg-white shadow-lg border border-slate-200 sticky top-24">
            <div className="card-body">
                <h3 className="card-title text-lg mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Post a Note
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title Input */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Title
                            </span>
                        </label>
                        <div className="relative">
                            <Type className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="input input-bordered w-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Note title"
                                disabled={isSubmitting}
                                maxLength={100}
                            />
                        </div>
                        <label className="label">
                            <span className="label-text-alt text-gray-400">
                                {title.length}/100
                            </span>
                        </label>
                    </div>

                    {/* Content Input */}
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text font-semibold">
                                Content
                            </span>
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="textarea textarea-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Share your notes with the class..."
                            rows="5"
                            disabled={isSubmitting}
                            maxLength={5000}
                        />
                        <label className="label">
                            <span className="label-text-alt text-gray-400">
                                {content.length}/5000
                            </span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary w-full gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading loading-spinner loading-sm"></span>
                                Posting...
                            </>
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Post Note
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
