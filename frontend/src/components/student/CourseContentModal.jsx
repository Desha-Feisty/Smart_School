import { BookOpen, X, Zap, Clock, MessageSquare } from "lucide-react";
import NoteCard from "../NoteCard";

export default function CourseContentModal({
    viewContentCourse,
    setViewContentCourse,
    setCourseContentNotes,
    availableQuizzes,
    startingQuizId,
    handleStartQuiz,
    contentNotesLoading,
    courseContentNotes
}) {
    if (!viewContentCourse) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto w-full h-full">
            <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8 rounded-3xl animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col">
                {/* Modal Header */}
                <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700/50 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {viewContentCourse.title}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                {viewContentCourse.description}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setViewContentCourse(null);
                            setCourseContentNotes([]);
                        }}
                        className="btn btn-ghost btn-circle text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 md:p-8 space-y-10 bg-slate-50/50 dark:bg-base-200/50 flex-1">
                    {/* Quizzes Section */}
                    <div>
                        <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            Course Quizzes
                        </h3>
                        {availableQuizzes.filter(
                            (q) => q.course?._id === viewContentCourse._id,
                        ).length === 0 ? (
                            <div className="text-center py-8 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-2xl border border-yellow-200 border-dashed dark:border-yellow-800/30">
                                <p className="text-slate-600 dark:text-slate-400">
                                    No quizzes available for this course yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {availableQuizzes
                                    .filter(
                                        (q) => q.course?._id === viewContentCourse._id,
                                    )
                                    .map((quiz) => (
                                        <div
                                            key={quiz._id}
                                            className="glass-card"
                                        >
                                            <div className="card-body p-5">
                                                <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1 line-clamp-1">
                                                            {quiz.title}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            Closes{" "}
                                                            {new Date(
                                                                quiz.closeAt,
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            handleStartQuiz(
                                                                quiz._id,
                                                            );
                                                            setViewContentCourse(
                                                                null,
                                                            );
                                                        }}
                                                        disabled={
                                                            startingQuizId ===
                                                            quiz._id
                                                        }
                                                        className="btn btn-primary btn-sm shadow-sm"
                                                    >
                                                        {startingQuizId ===
                                                        quiz._id ? (
                                                            <span className="loading loading-spinner loading-xs"></span>
                                                        ) : (
                                                            "Start"
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Notes Section */}
                    <div>
                        <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-slate-900 dark:text-white">
                            <MessageSquare className="w-5 h-5 text-purple-500" />
                            Course Notes
                        </h3>
                        {contentNotesLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <span className="loading loading-spinner loading-lg text-blue-500"></span>
                            </div>
                        ) : courseContentNotes.length === 0 ? (
                            <div className="text-center py-8 bg-purple-50/50 dark:bg-purple-900/10 rounded-2xl border border-purple-200 border-dashed dark:border-purple-800/30">
                                <p className="text-slate-600 dark:text-slate-400">
                                    No notes posted yet for this course.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {courseContentNotes.map((note) => (
                                    <NoteCard
                                        key={note._id}
                                        note={note}
                                        isTeacher={false}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
