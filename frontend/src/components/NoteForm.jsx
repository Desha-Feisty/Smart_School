import { useState } from "react";
import useTeacherStore from "../stores/Teacherstore";

export default function NoteForm({ courseId, onNoteCreated }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const createNote = useTeacherStore((state) => state.createNote);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim() || !content.trim()) {
            setError("Title and content are required");
            return;
        }

        setIsSubmitting(true);
        try {
            await createNote(courseId, { title, content });
            setTitle("");
            setContent("");
            if (onNoteCreated) onNoteCreated();
        } catch (err) {
            setError(err.message || "Failed to create note");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white p-4 rounded-lg shadow"
        >
            <h3 className="text-lg font-semibold mb-4">Post a Note</h3>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Note title"
                    disabled={isSubmitting}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Note content"
                    rows="5"
                    disabled={isSubmitting}
                />
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
                {isSubmitting ? "Posting..." : "Post Note"}
            </button>
        </form>
    );
}
