import { useNavigate } from "react-router-dom";

export default function NoteCard({ note, isTeacher }) {
    const navigate = useNavigate();

    const handleViewDetails = () => {
        navigate(`/note/${note._id}`);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-semibold text-gray-900">
                    {note.title}
                </h4>
                {isTeacher && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Posted by you
                    </span>
                )}
            </div>

            <p className="text-sm text-gray-600 mb-3">
                By {note.teacher?.name || "Unknown"}
            </p>

            <p className="text-gray-700 mb-4 line-clamp-3">{note.content}</p>

            <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                    {note.commentCount || 0} comments
                </span>
                <button
                    onClick={handleViewDetails}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                    View Discussion
                </button>
            </div>
        </div>
    );
}
