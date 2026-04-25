import { MessageSquare } from "lucide-react";
import NoteForm from "../NoteForm";
import NoteCard from "../NoteCard";

export default function CourseCommunityTab({
    courseId,
    loadCourseNotes,
    notesLoading,
    courseNotes
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
                <div className="sticky top-20">
                    <NoteForm
                        courseId={courseId}
                        onNoteCreated={loadCourseNotes}
                    />
                </div>
            </div>

            <div className="lg:col-span-3">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                    Course Notes
                </h2>

                {notesLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="loading loading-spinner loading-lg text-blue-600"></span>
                    </div>
                ) : courseNotes.length === 0 ? (
                    <div className="card bg-purple-50 border border-purple-200 border-dashed">
                        <div className="card-body text-center py-12">
                            <MessageSquare className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                            <p className="text-gray-600">
                                No notes posted yet. Create one to
                                engage with students!
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {courseNotes.map((note) => (
                            <NoteCard
                                key={note._id}
                                note={note}
                                isTeacher={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
