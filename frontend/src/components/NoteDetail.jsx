import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useTeacherStore from "../stores/Teacherstore";
import useAuthStore from "../stores/Authstore";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

export default function NoteDetail() {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [note, setNote] = useState(null);
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const getNoteWithComments = useTeacherStore(
        (state) => state.getNoteWithComments,
    );
    const updateNote = useTeacherStore((state) => state.updateNote);
    const deleteNote = useTeacherStore((state) => state.deleteNote);

    useEffect(() => {
        loadNote();
    }, [noteId]);

    const loadNote = async () => {
        setIsLoading(true);
        setError("");
        try {
            const { note: loadedNote, comments: loadedComments } =
                await getNoteWithComments(noteId);
            setNote(loadedNote);
            setComments(loadedComments || []);
            setEditContent(loadedNote.content);
        } catch (err) {
            setError(err.message || "Failed to load note");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!editContent.trim()) {
            setError("Content cannot be empty");
            return;
        }

        setIsUploading(true);
        try {
            await updateNote(noteId, { content: editContent });
            setNote({ ...note, content: editContent });
            setIsEditMode(false);
        } catch (err) {
            setError(err.message || "Failed to update note");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this note? All comments will be deleted."))
            return;

        setIsUploading(true);
        try {
            await deleteNote(noteId);
            navigate(-1);
        } catch (err) {
            setError(err.message || "Failed to delete note");
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    if (error && !note) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <button
                    onClick={() => navigate(-1)}
                    className="text-blue-600 hover:text-blue-800 mb-4"
                >
                    ← Back
                </button>
                <div className="p-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            </div>
        );
    }

    const isNoteAuthor = user?.id === note?.teacher._id;

    return (
        <div className="max-w-3xl mx-auto p-6">
            <button
                onClick={() => navigate(-1)}
                className="text-blue-600 hover:text-blue-800 mb-4"
            >
                ← Back
            </button>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Note Header */}
            <div className="bg-white p-6 rounded-lg shadow mb-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {note?.title}
                        </h1>
                        <p className="text-gray-600">
                            By {note?.teacher.name} •{" "}
                            {new Date(note?.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    {isNoteAuthor && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditMode(!isEditMode)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {isEditMode ? "Cancel" : "Edit"}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isUploading}
                                className="text-red-600 hover:text-red-800 font-medium disabled:text-gray-400"
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>

                {isEditMode ? (
                    <div className="space-y-3">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="6"
                            disabled={isUploading}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleEdit}
                                disabled={isUploading}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isUploading ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditMode(false);
                                    setEditContent(note.content);
                                }}
                                disabled={isUploading}
                                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:bg-gray-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                        {note?.content}
                    </div>
                )}

                {note?.editHistory && note.editHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <details className="text-sm text-gray-500">
                            <summary className="cursor-pointer hover:text-gray-700">
                                Edit history ({note.editHistory.length})
                            </summary>
                            <div className="mt-2 space-y-1 text-xs">
                                {note.editHistory.map((edit, idx) => (
                                    <p key={idx}>
                                        {new Date(
                                            edit.editedAt,
                                        ).toLocaleString()}{" "}
                                        - Previous version shown
                                    </p>
                                ))}
                            </div>
                        </details>
                    </div>
                )}
            </div>

            {/* Comments Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Discussion ({comments.length})
                </h2>

                <CommentForm noteId={noteId} onCommentAdded={loadNote} />

                <div className="mt-6 space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            No comments yet. Be the first!
                        </p>
                    ) : (
                        comments.map((comment) => (
                            <CommentItem
                                key={comment._id}
                                comment={comment}
                                isTeacher={isNoteAuthor}
                                onCommentDeleted={loadNote}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
