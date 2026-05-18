import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useQuizStore from "../stores/Quizstore";
import useAuthStore from "../stores/Authstore";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    Send,
    EyeOff,
    CheckCircle,
    X,
    Sparkles,
} from "lucide-react";
import PageWrapper from "../components/layout/PageWrapper";

function QuizQuestionsPage() {
    const { id: quizId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const {
        listQuizQuestions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        generateAiQuestions,
        publishQuiz,
        unpublishQuiz,
        errMsg,
        clearErrMsg,
    } = useQuizStore();

    const [questions, setQuestions] = useState([]);
    const [quizPublished, setQuizPublished] = useState(false);
    const [courseId, setCourseId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [aiCount, setAiCount] = useState(5);
    const [aiQuestionType, setAiQuestionType] = useState("mcq_single");
    const [aiPoints, setAiPoints] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

    const [formData, setFormData] = useState({
        prompt: "",
        questionType: "mcq_single",
        points: 1,
        choices: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
        ],
        sampleAnswer: "",
        rubric: "",
    });

    const fetchQuestions = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await listQuizQuestions(quizId);
            setQuestions(data.questions || data);
            if (data.quiz) {
                setQuizPublished(data.quiz.published || false);
                const courseIdValue = data.quiz.course?._id || data.quiz.course;
                if (courseIdValue) {
                    setCourseId(courseIdValue);
                }
            }
        } catch {
            // Silent error
        } finally {
            setIsLoading(false);
        }
    }, [quizId, listQuizQuestions]);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchQuestions();
    }, [quizId, token, navigate, fetchQuestions]);

    const handlePublish = async () => {
        try {
            await publishQuiz(quizId);
            setQuizPublished(true);
            toast.success("Quiz published successfully");
        } catch (err) {
            toast.error(err.message || "Failed to publish quiz");
        }
    };

    const handleUnpublish = async () => {
        try {
            await unpublishQuiz(quizId);
            setQuizPublished(false);
            toast.success("Quiz unpublished successfully");
        } catch (err) {
            toast.error(err.message || "Failed to unpublish quiz");
        }
    };

    const handleChoiceChange = (index, field, value) => {
        const newChoices = [...formData.choices];
        newChoices[index][field] = value;

        if (field === "isCorrect" && value === true) {
            newChoices.forEach((c, i) => {
                if (i !== index) c.isCorrect = false;
            });
        }
        setFormData({ ...formData, choices: newChoices });
    };

    const addChoice = () => {
        setFormData({
            ...formData,
            choices: [...formData.choices, { text: "", isCorrect: false }],
        });
    };

    const removeChoice = (index) => {
        if (formData.choices.length <= 2) {
            toast.error("At least 2 choices are required");
            return;
        }
        const newChoices = formData.choices.filter((_, i) => i !== index);
        if (!newChoices.some((c) => c.isCorrect)) {
            newChoices[0].isCorrect = true;
        }
        setFormData({ ...formData, choices: newChoices });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.prompt.trim()) {
            toast.error("Question prompt is required");
            return;
        }

        // Validate based on question type
        if (formData.questionType === "mcq_single") {
            if (formData.choices.some((c) => !c.text.trim())) {
                toast.error("All choice text fields must be filled");
                return;
            }
            if (!formData.choices.some((c) => c.isCorrect)) {
                toast.error("Select a correct answer");
                return;
            }
        }

        setIsSubmitting(true);
        try {
            // Prepare payload based on question type
            const payload = { ...formData };
            if (formData.questionType === "written") {
                // Remove choices for written questions
                delete payload.choices;
                // Only include sampleAnswer and rubric if they have values
                if (!payload.sampleAnswer) delete payload.sampleAnswer;
                if (!payload.rubric) delete payload.rubric;
            }

            if (editingId) {
                await updateQuestion(editingId, payload);
                toast.success("Question updated successfully");
            } else {
                await addQuestion(quizId, payload);
                toast.success("Question added successfully");
            }
            setFormData({
                prompt: "",
                questionType: "mcq_single",
                points: 1,
                choices: [
                    { text: "", isCorrect: true },
                    { text: "", isCorrect: false },
                ],
                sampleAnswer: "",
                rubric: "",
            });
            setIsAdding(false);
            setEditingId(null);
            fetchQuestions();
        } catch (err) {
            toast.error(err.message || "Failed to save question");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAiGenerate = async (e) => {
        e.preventDefault();
        if (!aiTopic.trim()) {
            toast.error("Please enter a topic");
            return;
        }
        setIsGenerating(true);
        try {
            await generateAiQuestions(quizId, aiTopic, aiCount, aiQuestionType, aiPoints);
            toast.success(`Successfully generated ${aiCount} ${aiQuestionType === "written" ? "written" : "multiple choice"} questions!`);
            setIsAiModalOpen(false);
            setAiTopic("");
            setAiQuestionType("mcq_single");
            setAiPoints(1);
            fetchQuestions();
        } catch (err) {
            const errorMsg = err.response?.data?.errMsg || err.message || "Failed to generate AI questions";
            toast.error(errorMsg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEdit = (q) => {
        setFormData({
            prompt: q.prompt,
            questionType: q.questionType || "mcq_single",
            points: q.points,
            choices: q.choices ? q.choices.map((c) => ({
                text: c.text,
                isCorrect: c.isCorrect,
            })) : [
                { text: "", isCorrect: true },
                { text: "", isCorrect: false },
            ],
            sampleAnswer: q.sampleAnswer || "",
            rubric: q.rubric || "",
        });
        setEditingId(q._id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (questionId) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            try {
                await deleteQuestion(questionId);
                fetchQuestions();
                toast.success("Question deleted successfully");
            } catch {
                toast.error("Failed to delete question");
            }
        }
    };

    if (isLoading)
        return (
            <div className="min-h-screen flex items-center justify-center dark:bg-base-300">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );

    return (
        <PageWrapper>
            <main className="max-w-5xl mx-auto px-6 py-8 animate-in fade-in duration-500 relative z-10">
                {/* Error Alert */}
                {errMsg && (
                    <div className="alert alert-error mb-8">
                        <span>{errMsg}</span>
                        <button
                            onClick={clearErrMsg}
                            className="btn btn-ghost btn-sm"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Questions Header Card */}
                <div className="glass-panel overflow-hidden mb-8 border border-white/40 dark:border-slate-700/50 shadow-xl shadow-blue-900/5 rounded-3xl">
                    <div className="p-8 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                    <button
                                        onClick={() => courseId ? navigate(`/teacher/course/${courseId}`) : navigate(-1)}
                                        className="btn btn-ghost btn-xs btn-circle dark:text-slate-300"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    <p className="text-sm font-medium uppercase tracking-wider">Manage Questions</p>
                                </div>
                                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                                    Quiz Content
                                    <span className="badge badge-primary bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0">{questions.length}</span>
                                </h1>
                            </div>
                            {!isAdding && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {!quizPublished ? (
                                        <button
                                            onClick={handlePublish}
                                            className="btn bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/20 border-0 rounded-xl hover:-translate-y-0.5 transition-transform"
                                        >
                                            <Send className="w-5 h-5 mr-1" />
                                            Publish Quiz
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleUnpublish}
                                            className="btn bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20 border-0 rounded-xl hover:-translate-y-0.5 transition-transform"
                                        >
                                            <EyeOff className="w-5 h-5 mr-1" />
                                            Unpublish
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Generator Modal */}
                {isAiModalOpen && (
                    <div className="glass-panel overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-900/10 mb-8 animate-in slide-in-from-top-4 rounded-3xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-purple-500"></div>
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-6 h-6 text-fuchsia-500" />
                                    Magic Quiz Generator
                                </h2>
                                <button onClick={() => setIsAiModalOpen(false)} className="btn btn-ghost btn-circle btn-sm">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleAiGenerate} className="space-y-6">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                            What should the questions be about?
                                        </span>
                                    </label>
                                    <textarea
                                        required
                                        value={aiTopic}
                                        onChange={(e) => setAiTopic(e.target.value)}
                                        className="textarea h-32 bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 rounded-xl text-lg resize-y"
                                        placeholder="E.g., The history of the Roman Empire, Newton's Laws of Motion, or paste a block of text..."
                                    />
                                </div>
                                
                                {/* Question Type Selector */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                            Question Type
                                        </span>
                                    </label>
                                    <div className="flex gap-4">
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${aiQuestionType === "mcq_single" ? "bg-purple-50/50 dark:bg-purple-900/10 border-purple-400 dark:border-purple-500/50" : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                            <input
                                                type="radio"
                                                name="aiQuestionType"
                                                value="mcq_single"
                                                checked={aiQuestionType === "mcq_single"}
                                                onChange={(e) => setAiQuestionType(e.target.value)}
                                                className="radio radio-primary"
                                            />
                                            <span className="font-medium text-sm">Multiple Choice</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${aiQuestionType === "written" ? "bg-purple-50/50 dark:bg-purple-900/10 border-purple-400 dark:border-purple-500/50" : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                            <input
                                                type="radio"
                                                name="aiQuestionType"
                                                value="written"
                                                checked={aiQuestionType === "written"}
                                                onChange={(e) => setAiQuestionType(e.target.value)}
                                                className="radio radio-primary"
                                            />
                                            <span className="font-medium text-sm">Written (AI Graded)</span>
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="flex gap-6">
                                <div className="form-control max-w-xs">
                                    <label className="label">
                                        <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                            Number of Questions
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={aiCount}
                                        onChange={(e) => setAiCount(parseInt(e.target.value))}
                                        className="input bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 rounded-xl text-lg w-32 font-mono"
                                    />
                                </div>
                                <div className="form-control max-w-xs">
                                    <label className="label">
                                        <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                            Points per Question
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={aiPoints}
                                        onChange={(e) => setAiPoints(parseInt(e.target.value))}
                                        className="input bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 rounded-xl text-lg w-32 font-mono"
                                    />
                                </div>
                            </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isGenerating}
                                        className="btn bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white px-8 rounded-xl shadow-lg shadow-purple-500/20 border-0 hover:-translate-y-0.5 transition-transform gap-2"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Add/Edit Form */}
                {isAdding && (
                    <div className="glass-panel overflow-hidden border border-white/40 dark:border-slate-700/50 shadow-xl mb-8 animate-in slide-in-from-top-4 rounded-3xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                        <div className="p-8">
                            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                                <Edit className="w-6 h-6 text-emerald-500" />
                                {editingId ? "Edit Question" : "Add New Question"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Question Type Selector */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                            Question Type
                                        </span>
                                    </label>
                                    <div className="flex gap-4">
                                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.questionType === "mcq_single" ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-400 dark:border-emerald-500/50" : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                            <input
                                                type="radio"
                                                name="questionType"
                                                value="mcq_single"
                                                checked={formData.questionType === "mcq_single"}
                                                onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                                                className="radio radio-primary"
                                            />
                                            <span className="font-medium">Multiple Choice</span>
                                        </label>
                                        <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.questionType === "written" ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-400 dark:border-emerald-500/50" : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-slate-300"}`}>
                                            <input
                                                type="radio"
                                                name="questionType"
                                                value="written"
                                                checked={formData.questionType === "written"}
                                                onChange={(e) => setFormData({ ...formData, questionType: e.target.value })}
                                                className="radio radio-primary"
                                            />
                                            <span className="font-medium">Written (AI Graded)</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Question Prompt */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                            Question Prompt
                                        </span>
                                    </label>
                                    <textarea
                                        required
                                        value={formData.prompt}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                prompt: e.target.value,
                                            })
                                        }
                                        className="textarea h-32 bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-lg resize-y"
                                        placeholder="Enter your question here..."
                                    />
                                </div>

                                {/* Points */}
                                <div className="form-control max-w-xs">
                                    <label className="label">
                                        <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                            Point Value
                                        </span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.points}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                points: parseInt(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                        className="input bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl text-lg w-32 font-mono"
                                    />
                                </div>

                                {formData.questionType === "mcq_single" && (
                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                    <label className="label px-0">
                                        <span className="label-text font-semibold text-lg text-slate-800 dark:text-slate-200">
                                            Answer Choices
                                        </span>
                                    </label>
                                    <div className="space-y-3">
                                        {formData.choices.map((choice, index) => (
                                            <div
                                                key={index}
                                                className={`flex flex-col sm:flex-row gap-3 items-start sm:items-center p-5 rounded-2xl border-2 transition-all ${choice.isCorrect ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-400 dark:border-emerald-500/50 shadow-sm shadow-emerald-500/10' : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                            >
                                                <div className="form-control flex-1 w-full">
                                                    <input
                                                        type="text"
                                                        required
                                                        value={choice.text}
                                                        onChange={(e) => handleChoiceChange(index, "text", e.target.value)}
                                                        className="input input-lg w-full bg-white dark:bg-base-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-xl border-slate-200 dark:border-slate-700"
                                                        placeholder={`Option ${index + 1}`}
                                                    />
                                                </div>

                                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                                                    <div className="form-control">
                                                        <label className="label cursor-pointer gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                                            <input
                                                                type="radio"
                                                                name="correct"
                                                                checked={choice.isCorrect}
                                                                onChange={() => handleChoiceChange(index, "isCorrect", true)}
                                                                className="radio radio-success"
                                                            />
                                                            <span className={`label-text font-bold ${choice.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                                                                Correct Answer
                                                            </span>
                                                        </label>
                                                    </div>

                                                    {formData.choices.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeChoice(index)}
                                                            className="btn btn-ghost btn-circle text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors"
                                                            title="Remove choice"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addChoice}
                                        className="btn btn-outline border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 w-full rounded-2xl py-6 gap-2 border-dashed mt-4 group"
                                    >
                                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        Add Another Option
                                    </button>
                                </div>
                                )}

                                {formData.questionType === "written" && (
                                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            <strong>AI Grading:</strong> Student answers will be automatically graded using AI. You can optionally provide a sample answer and rubric to help the AI grade more accurately.
                                        </p>
                                    </div>
                                    
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                                Sample Answer (Optional)
                                            </span>
                                        </label>
                                        <textarea
                                            value={formData.sampleAnswer}
                                            onChange={(e) => setFormData({ ...formData, sampleAnswer: e.target.value })}
                                            className="textarea h-24 bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl resize-y"
                                            placeholder="Enter a sample ideal answer to help the AI grade more accurately..."
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-semibold text-slate-700 dark:text-slate-300">
                                                Rubric (Optional)
                                            </span>
                                        </label>
                                        <textarea
                                            value={formData.rubric}
                                            onChange={(e) => setFormData({ ...formData, rubric: e.target.value })}
                                            className="textarea h-24 bg-white/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 rounded-xl resize-y"
                                            placeholder="Enter grading criteria or rubric to help the AI evaluate answers..."
                                        />
                                    </div>
                                </div>
                                )}

                                {/* Form Actions */}
                                <div className="flex gap-4 pt-6 border-t border-slate-200 dark:border-slate-700/50 mt-8">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn btn-success text-white px-8 rounded-xl shadow-lg shadow-success/20 hover:-translate-y-0.5 transition-transform gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                {editingId ? "Save Changes" : "Create Question"}
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsAdding(false);
                                            setEditingId(null);
                                            setFormData({
                                                prompt: "",
                                                questionType: "mcq_single",
                                                points: 1,
                                                choices: [
                                                    { text: "", isCorrect: true },
                                                    { text: "", isCorrect: false },
                                                ],
                                                sampleAnswer: "",
                                                rubric: "",
                                            });
                                        }}
                                        className="btn btn-ghost px-6 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Questions List */}
                <div className="space-y-6">
                    {!isAdding && (
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsAiModalOpen(true)}
                                className="btn bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/20 border-0 rounded-xl"
                            >
                                <Sparkles className="w-5 h-5 mr-1" />
                                Magic Generate
                            </button>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="btn btn-primary shadow-lg shadow-blue-500/20 rounded-xl"
                            >
                                <Plus className="w-5 h-5 mr-1" />
                                Add Question
                            </button>
                        </div>
                    )}
                    {questions.length === 0 && !isAdding ? (
                        <div className="glass-panel border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10">
                            <div className="p-12 text-center">
                                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                                    <Plus className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No questions yet</h3>
                                <p className="text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                                    Get started by adding your first question to this quiz.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                                    <button
                                        onClick={() => setIsAdding(true)}
                                        className="btn btn-primary px-8 rounded-xl shadow-lg shadow-blue-500/20"
                                    >
                                        <Plus className="w-5 h-5 mr-1" />
                                        Add Question
                                    </button>
                                    <button
                                        onClick={() => setIsAiModalOpen(true)}
                                        className="btn bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/20 border-0 rounded-xl"
                                    >
                                        <Sparkles className="w-5 h-5 mr-1" />
                                        Generate with AI
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        questions.map((q, idx) => (
                            <div
                                key={q._id}
                                className="glass-card overflow-hidden hover:-translate-y-1 transition-all group"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400 dark:bg-blue-500 group-hover:bg-blue-500 dark:group-hover:bg-blue-400 transition-colors"></div>
                                <div className="p-8 ml-1.5 border-b border-slate-100 dark:border-slate-800/50">
                                    {/* Question Header */}
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xl shadow-inner border border-blue-200 dark:border-blue-800">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <div className="badge badge-ghost font-medium text-slate-600 dark:text-slate-400 mb-1 border-slate-200 dark:border-slate-700">
                                                    {q.points} {q.points === 1 ? "Point" : "Points"}
                                                </div>
                                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                                    {q.questionType === "written" ? "Written Question" : "Multiple Choice"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(q)}
                                                className="btn btn-square btn-sm btn-ghost hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                title="Edit Question"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(q._id)}
                                                className="btn btn-square btn-sm btn-ghost hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400"
                                                title="Delete Question"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Question Prompt */}
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">
                                        {q.prompt}
                                    </h3>

                                    {/* Answer Choices or Sample Answer */}
                                    {q.questionType === "written" ? (
                                        <div className="space-y-4">
                                            {q.sampleAnswer && (
                                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sample Answer</p>
                                                    <p className="text-slate-700 dark:text-slate-300 italic">"{q.sampleAnswer}"</p>
                                                </div>
                                            )}
                                            {q.rubric && (
                                                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Grading Rubric</p>
                                                    <p className="text-slate-700 dark:text-slate-300">{q.rubric}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {q.choices?.map((c, i) => (
                                                <div
                                                    key={i}
                                                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                                        c.isCorrect
                                                            ? "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-400 dark:border-emerald-500/50 shadow-sm shadow-emerald-500/10"
                                                            : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700"
                                                    }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 ${c.isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 text-slate-400'}`}>
                                                        {c.isCorrect ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-semibold">{String.fromCharCode(65 + i)}</span>}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`text-lg ${c.isCorrect ? "font-bold text-emerald-900 dark:text-emerald-100" : "font-medium text-slate-700 dark:text-slate-300"}`}>
                                                            {c.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </PageWrapper>
    );
}

export default QuizQuestionsPage;