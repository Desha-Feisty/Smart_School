import { MessageSquare } from "lucide-react";
import NoteCard from "../NoteCard";

export default function StudentCommunityTab({
    allNotesLoading,
    allCourseNotes
}) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-panel overflow-hidden rounded-2xl mb-8">
                <div className="p-6 flex items-center gap-4 bg-purple-500/5 dark:bg-purple-500/10">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                        <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            Community Notes
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Viewing notes from all your joined courses
                        </p>
                    </div>
                </div>
            </div>

            {allNotesLoading ? (
                <div className="flex items-center justify-center py-12">
                    <span className="loading loading-spinner loading-lg text-purple-500"></span>
                </div>
            ) : allCourseNotes.length === 0 ? (
                <div className="text-center py-16 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 border-dashed dark:border-purple-800/30">
                    <MessageSquare className="w-16 h-16 text-purple-300 dark:text-purple-700/50 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">
                        No notes posted yet in any of your courses.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {allCourseNotes.map((note) => (
                        <NoteCard
                            key={note._id}
                            note={note}
                            isTeacher={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
