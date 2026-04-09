import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useTeacherStore from "../stores/Teacherstore";
import useAuthStore from "../stores/Authstore";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Edit,
    Trash2,
    MessageCircle,
    Calendar,
    User,
    History,
    Save,
    X,
} from "lucide-react";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

export default function NoteDetail() {
    const { noteId } = useParams();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const [note, setNote] = useState(null);
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
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
        try {
            const { note: loadedNote, comments: loadedComments } =
                await getNoteWithComments(noteId);
            setNote(loadedNote);
            setComments(loadedComments || []);
            setEditContent(loadedNote.content);
        } catch (err) {
            toast.error(err.message || "Failed to load note");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!editContent.trim()) {
            toast.error("Content cannot be empty");
            return;
        }

        setIsUploading(true);
        try {
            await updateNote(noteId, { content: editContent });
            setNote({ ...note, content: editContent });
            setIsEditMode(false);
            toast.success("Note updated successfully");
        } catch (err) {
            toast.error(err.message || "Failed to update note");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async () => {
        if (
            !window.confirm(
                "Delete this note permanently? All comments will be deleted.",
            )
        )
            return;

        setIsUploading(true);
        try {
            await deleteNote(noteId);
            toast.success("Note deleted successfully");
            navigate(-1);
        } catch (err) {
            toast.error(err.message || "Failed to delete note");
            setIsUploading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );
    }

    if (!note) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center">
                <p className="text-gray-600 mb-4">Note not found</p>
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-primary gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Go Back
                </button>
            </div>
        );
    }

    const isNoteAuthor = user?.id === note?.teacher._id;
    const noteDate = new Date(note?.createdAt).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-ghost btn-circle gap-0"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <p className="text-sm text-gray-600">Viewing Note</p>
                        <h1 className="text-xl font-bold text-gray-900 line-clamp-1">
                            {note.title}
                        </h1>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Note Card */}
                <div className="card bg-white shadow-lg border border-slate-200 mb-8">
                    <div className="card-body">
                        {/* Note Header */}
                        <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-200">
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    {note.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4" />
                                        <span className="font-semibold">
                                            {note.teacher?.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>{noteDate}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {isNoteAuthor && (
                                <div className="flex gap-2">
                                    {!isEditMode && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    setIsEditMode(true)
                                                }
                                                className="btn btn-ghost btn-sm gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={handleDelete}
                                                disabled={isUploading}
                                                className="btn btn-ghost btn-sm gap-2 text-error"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Note Content */}
                        {isEditMode ? (
                            <div className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">
                                            Edit Content
                                        </span>
                                    </label>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) =>
                                            setEditContent(e.target.value)
                                        }
                                        className="textarea textarea-bordered h-64 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                        disabled={isUploading}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleEdit}
                                        disabled={isUploading}
                                        className="btn btn-primary gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditMode(false);
                                            setEditContent(note.content);
                                        }}
                                        disabled={isUploading}
                                        className="btn btn-ghost gap-2"
                                    >
                                        <X className="w-5 h-5" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none mb-6">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {note.content}
                                </p>
                            </div>
                        )}

                        {/* Edit History */}
                        {note.editHistory && note.editHistory.length > 0 && (
                            <div className="collapse collapse-arrow bg-blue-50 border border-blue-200 mt-6">
                                <input type="checkbox" />
                                <div className="collapse-title font-semibold text-gray-900 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Edit History ({note.editHistory.length})
                                </div>
                                <div className="collapse-content space-y-2 text-sm">
                                    {note.editHistory.map((edit, idx) => (
                                        <p key={idx} className="text-gray-600">
                                            <span className="font-semibold">
                                                {new Date(
                                                    edit.editedAt,
                                                ).toLocaleString()}
                                            </span>{" "}
                                            - Version{" "}
                                            {note.editHistory.length - idx}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Comments Section */}
                <div className="card bg-white shadow-lg border border-slate-200">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-2 flex items-center gap-2">
                            <MessageCircle className="w-6 h-6 text-blue-600" />
                            Discussion
                        </h2>
                        <p className="text-sm text-gray-600 mb-6">
                            {comments.length}{" "}
                            {comments.length === 1 ? "comment" : "comments"}
                        </p>

                        {/* Comment Form */}
                        <CommentForm
                            noteId={noteId}
                            onCommentAdded={loadNote}
                        />

                        {/* Comments List */}
                        <div className="mt-8 space-y-4">
                            {comments.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">
                                        No comments yet. Be the first to share
                                        your thoughts!
                                    </p>
                                </div>
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
            </main>
        </div>
    );
}
