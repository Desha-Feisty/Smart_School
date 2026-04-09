import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowRight, User } from "lucide-react";

export default function NoteCard({ note, isTeacher }) {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        navigate(`/note/${note._id}`);
    };

    const createdDate = new Date(note.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="card bg-white shadow-md hover:shadow-xl border border-slate-200 transition-all hover:border-blue-300 group cursor-pointer overflow-hidden">
            <div className="card-body p-5" onClick={handleViewDetails}>
                <div className="flex items-start justify-between mb-3">
                    <h4 className="card-title text-base text-gray-900 group-hover:text-blue-600 transition line-clamp-2">
                        {note.title}
                    </h4>
                    {isTeacher && (
                        <div className="badge badge-primary badge-sm">
                            Your Note
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <User className="w-4 h-4" />
                    <span>{note.teacher?.name || "Unknown"}</span>
                    <span className="text-gray-400 mx-1">•</span>
                    <span>{createdDate}</span>
                </div>

                <p className="text-gray-700 text-sm line-clamp-2 mb-4">
                    {note.content}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageCircle className="w-4 h-4" />
                        <span>
                            {note.commentCount || 0}{" "}
                            {note.commentCount === 1 ? "comment" : "comments"}
                        </span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition" />
                </div>
            </div>
        </div>
    );
}
