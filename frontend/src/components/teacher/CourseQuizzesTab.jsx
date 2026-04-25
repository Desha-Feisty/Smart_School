import { BookOpen, CheckCircle, Clock, Eye, Trash2, Plus } from "lucide-react";

export default function CourseQuizzesTab({
    quizzes,
    navigate,
    handlePublishQuiz,
    handleUnpublishQuiz,
    handleDeleteQuiz,
    handleCreateQuiz,
    newQuiz,
    setNewQuiz,
    isCreatingQuiz
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Quiz List */}
            <div className="lg:col-span-3 space-y-4">
                {quizzes.length === 0 ? (
                    <div className="card bg-blue-50 border border-blue-200 border-dashed">
                        <div className="card-body text-center py-12">
                            <BookOpen className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                            <p className="text-gray-600">
                                No quizzes created yet. Create one
                                to get started!
                            </p>
                        </div>
                    </div>
                ) : (
                    quizzes.map((quiz) => (
                        <div
                            key={quiz._id}
                            className="glass-card hover:-translate-y-1 transition-all overflow-hidden flex flex-col relative group"
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 dark:bg-blue-400/50 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-colors"></div>
                            <div className="card-body p-6 ml-1">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="card-title text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {quiz.title}
                                            </h3>
                                            {quiz.published ? (
                                                <span className="badge badge-success badge-sm py-2.5 shadow-sm shadow-success/20 gap-1 text-white px-3 font-medium">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Published
                                                </span>
                                            ) : (
                                                <span className="badge badge-warning badge-sm py-2.5 shadow-sm shadow-warning/20 gap-1 text-warning-content px-3 font-medium">
                                                    Draft
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                                            {quiz.description}
                                        </p>
                                        <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <Clock className="w-3.5 h-3.5 text-blue-500" />
                                                <span>Open: <span className="text-slate-700 dark:text-slate-300">{new Date(quiz.openAt).toLocaleString()}</span></span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                                <Clock className="w-3.5 h-3.5 text-orange-500" />
                                                <span>Close: <span className="text-slate-700 dark:text-slate-300">{new Date(quiz.closeAt).toLocaleString()}</span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                                        {!quiz.published ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handlePublishQuiz(quiz._id); }}
                                                className="btn btn-success btn-sm text-white shadow-md shadow-success/20 gap-2 w-full sm:w-auto hover:-translate-y-0.5 transition-transform"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Publish
                                            </button>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleUnpublishQuiz(quiz._id); }}
                                                className="btn btn-warning btn-sm text-warning-content shadow-md shadow-warning/20 gap-2 w-full sm:w-auto hover:-translate-y-0.5 transition-transform"
                                            >
                                                <Clock className="w-4 h-4" />
                                                Unpublish
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/teacher/quiz/${quiz._id}/questions`); }}
                                            className="btn btn-outline border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 btn-sm gap-2 w-full sm:w-auto dark:text-slate-300 hover:-translate-y-0.5 transition-transform"
                                        >
                                            <Eye className="w-4 h-4" />
                                            Questions
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteQuiz(quiz._id); }}
                                            className="btn btn-ghost text-red-500 dark:text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 btn-sm gap-2 w-full sm:w-auto"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Quiz Form */}
            <div className="lg:col-span-1">
                <div className="glass-panel overflow-hidden sticky top-24 rounded-3xl shadow-xl shadow-emerald-500/5 border border-white/40 dark:border-slate-700/50">
                    <div className="absolute top-0 w-full h-1 bg-emerald-500"></div>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                New Quiz
                            </h2>
                        </div>
                        <form
                            onSubmit={handleCreateQuiz}
                            className="space-y-4"
                        >
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                                        Title
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newQuiz.title}
                                    onChange={(e) =>
                                        setNewQuiz({
                                            ...newQuiz,
                                            title: e.target.value,
                                        })
                                    }
                                    className="input input-sm h-10 w-full bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl"
                                    placeholder="Quiz title"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text font-medium text-slate-700 dark:text-slate-300">
                                        Description
                                    </span>
                                </label>
                                <textarea
                                    value={newQuiz.description}
                                    onChange={(e) =>
                                        setNewQuiz({
                                            ...newQuiz,
                                            description:
                                                e.target.value,
                                        })
                                    }
                                    className="textarea h-24 w-full bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl py-2"
                                    placeholder="Description..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Open Date
                                        </span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={newQuiz.openAt}
                                        onChange={(e) =>
                                            setNewQuiz({
                                                ...newQuiz,
                                                openAt: e.target.value,
                                            })
                                        }
                                        className="input input-sm h-10 w-full bg-white dark:bg-base-300 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-slate-700 dark:text-slate-300"
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label py-1">
                                        <span className="label-text font-semibold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Close Date
                                        </span>
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={newQuiz.closeAt}
                                        onChange={(e) =>
                                            setNewQuiz({
                                                ...newQuiz,
                                                closeAt: e.target.value,
                                            })
                                        }
                                        className="input input-sm h-10 w-full bg-white dark:bg-base-300 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-slate-700 dark:text-slate-300"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium text-slate-700 dark:text-slate-300 text-xs">
                                            Duration (min)
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={
                                            newQuiz.durationMinutes
                                        }
                                        onChange={(e) =>
                                            setNewQuiz({
                                                ...newQuiz,
                                                durationMinutes:
                                                    parseInt(
                                                        e.target
                                                            .value,
                                                    ),
                                            })
                                        }
                                        className="input input-sm h-10 w-full bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-center"
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium text-slate-700 dark:text-slate-300 text-xs">
                                            Attempts
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={
                                            newQuiz.attemptsAllowed
                                        }
                                        onChange={(e) =>
                                            setNewQuiz({
                                                ...newQuiz,
                                                attemptsAllowed:
                                                    parseInt(
                                                        e.target
                                                            .value,
                                                    ),
                                            })
                                        }
                                        className="input input-sm h-10 w-full bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-center"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={isCreatingQuiz}
                                className="btn btn-success text-white w-full shadow-lg shadow-success/20 rounded-xl h-11 mt-2 hover:-translate-y-0.5 transition-transform"
                            >
                                {isCreatingQuiz ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Creating...
                                    </>
                                ) : (
                                    <span className="font-semibold tracking-wide flex items-center justify-center gap-2">
                                        <Plus className="w-5 h-5" />
                                        Create Quiz
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
