import { BookOpen, MessageSquare, ChevronRight } from "lucide-react";

export default function StudentCoursesTab({
    allCourses,
    setChatCourseId,
    setChatPeerId,
    setChatPeerName,
    setIsChatOpen,
    setViewContentCourse,
    loadCourseContentNotes
}) {
    return (
        <div>
            {allCourses.length === 0 ? (
                <div className="card bg-blue-50 border border-blue-200 border-dashed">
                    <div className="card-body text-center py-12">
                        <BookOpen className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                        <p className="text-gray-600">
                            You haven't joined any courses yet. Use
                            a join code to get started!
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allCourses.map((course) => (
                        <div
                            key={course._id}
                            className="glass-card group cursor-pointer"
                        >
                            <div className="card-body p-5">
                                <h3 className="card-title text-lg text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors line-clamp-1">
                                    {course.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                                    {course.description}
                                </p>
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                    <span>
                                        Joined{" "}
                                        {new Date(
                                            course.enrolledAt,
                                        ).toLocaleDateString()}
                                    </span>
                                    <span className="badge badge-primary badge-sm shadow-sm">
                                        Active
                                    </span>
                                </div>
                            </div>
                            <div className="card-actions border-t border-slate-200 dark:border-slate-700/50 pt-4 px-5 pb-5">
                                <div className="flex flex-col gap-2 w-full">
                                    <button
                                        onClick={() => {
                                            setChatCourseId(
                                                course._id,
                                            );
                                            setChatPeerId(
                                                course.teacher
                                                    ?._id ||
                                                    course.teacher,
                                            );
                                            setChatPeerName(
                                                course.teacher
                                                    ?.name ||
                                                    "Teacher",
                                            );
                                            setIsChatOpen(true);
                                        }}
                                        className="btn btn-outline btn-sm gap-2 w-full text-slate-700 dark:text-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Chat with Teacher
                                    </button>
                                    <button
                                        onClick={() => {
                                            setViewContentCourse(
                                                course,
                                            );
                                            loadCourseContentNotes(
                                                course._id,
                                            );
                                        }}
                                        className="btn btn-ghost btn-sm gap-2 w-full hover:bg-blue-50 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                                    >
                                        View Content
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
