import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useQuizStore from "../stores/Quizstore";
import useAuthStore from "../stores/Authstore";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    LogOut,
    Plus,
    Edit,
    Trash2,
    X,
    CheckCircle,
    Circle,
    Copy,
} from "lucide-react";

function QuizQuestionsPage() {
    const { id: quizId } = useParams();
    const navigate = useNavigate();
    const { token, logout } = useAuthStore();
    const {
        listQuizQuestions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        errMsg,
        clearErrMsg,
    } = useQuizStore();

    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        prompt: "",
        points: 1,
        choices: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
        ],
    });

    const fetchQuestions = async () => {
        setIsLoading(true);
        const data = await listQuizQuestions(quizId);
        setQuestions(data);
        setIsLoading(false);
    };

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchQuestions();
    }, [quizId, token, navigate]);

    const handleLogout = () => {
        logout();
        navigate("/login");
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
        if (formData.choices.some((c) => !c.text.trim())) {
            toast.error("All choice text fields must be filled");
            return;
        }
        if (!formData.choices.some((c) => c.isCorrect)) {
            toast.error("Select a correct answer");
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingId) {
                await updateQuestion(editingId, formData);
                toast.success("Question updated successfully");
            } else {
                await addQuestion(quizId, formData);
                toast.success("Question added successfully");
            }
            setFormData({
                prompt: "",
                points: 1,
                choices: [
                    { text: "", isCorrect: true },
                    { text: "", isCorrect: false },
                ],
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

    const handleEdit = (q) => {
        setFormData({
            prompt: q.prompt,
            points: q.points,
            choices: q.choices.map((c) => ({
                text: c.text,
                isCorrect: c.isCorrect,
            })),
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
            } catch (err) {
                toast.error("Failed to delete question");
            }
        }
    };

    if (isLoading)
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-blue-600"></span>
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Navigation Header */}
            <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="btn btn-ghost btn-circle gap-0"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <p className="text-sm text-gray-600">
                                Manage Questions
                            </p>
                            <h1 className="text-xl font-bold text-gray-900">
                                Quiz Questions
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn btn-ghost gap-2"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-8">
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

                {/* Add/Edit Form */}
                {isAdding && (
                    <div className="card bg-white shadow-lg border border-slate-200 mb-8">
                        <div className="card-body">
                            <h2 className="card-title text-2xl mb-6">
                                {editingId
                                    ? "Edit Question"
                                    : "Add New Question"}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Question Prompt */}
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-semibold">
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
                                        className="textarea textarea-bordered h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your question here..."
                                    />
                                </div>

                                {/* Points */}
                                <div className="form-control max-w-xs">
                                    <label className="label">
                                        <span className="label-text font-semibold">
                                            Points
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
                                        className="input input-bordered w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Choices */}
                                <div className="space-y-4">
                                    <label className="label">
                                        <span className="label-text font-semibold text-base">
                                            Answer Choices (Select the correct
                                            answer)
                                        </span>
                                    </label>
                                    <div className="space-y-3">
                                        {formData.choices.map(
                                            (choice, index) => (
                                                <div
                                                    key={index}
                                                    className="flex gap-3 items-end p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                                                >
                                                    <div className="form-control flex-1">
                                                        <input
                                                            type="text"
                                                            required
                                                            value={choice.text}
                                                            onChange={(e) =>
                                                                handleChoiceChange(
                                                                    index,
                                                                    "text",
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="input input-bordered input-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder={`Choice ${index + 1}`}
                                                        />
                                                    </div>

                                                    <div className="form-control">
                                                        <label className="label cursor-pointer gap-2">
                                                            <input
                                                                type="radio"
                                                                name="correct"
                                                                checked={
                                                                    choice.isCorrect
                                                                }
                                                                onChange={() =>
                                                                    handleChoiceChange(
                                                                        index,
                                                                        "isCorrect",
                                                                        true,
                                                                    )
                                                                }
                                                                className="radio radio-primary radio-sm"
                                                            />
                                                            <span
                                                                className={`label-text font-semibold text-sm ${
                                                                    choice.isCorrect
                                                                        ? "text-green-600"
                                                                        : "text-gray-600"
                                                                }`}
                                                            >
                                                                Correct
                                                            </span>
                                                        </label>
                                                    </div>

                                                    {formData.choices.length >
                                                        2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeChoice(
                                                                    index,
                                                                )
                                                            }
                                                            className="btn btn-ghost btn-sm gap-0 text-error"
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ),
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={addChoice}
                                        className="btn btn-ghost gap-2 text-blue-600"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Choice
                                    </button>
                                </div>

                                {/* Form Actions */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="btn btn-success gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-5 h-5" />
                                                {editingId
                                                    ? "Update Question"
                                                    : "Create Question"}
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
                                                points: 1,
                                                choices: [
                                                    {
                                                        text: "",
                                                        isCorrect: true,
                                                    },
                                                    {
                                                        text: "",
                                                        isCorrect: false,
                                                    },
                                                ],
                                            });
                                        }}
                                        className="btn btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Questions List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Questions ({questions.length})
                        </h2>
                        {!isAdding && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="btn btn-primary gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Question
                            </button>
                        )}
                    </div>

                    {questions.length === 0 ? (
                        <div className="card bg-blue-50 border border-blue-200 border-dashed">
                            <div className="card-body text-center py-12">
                                <p className="text-gray-600">
                                    No questions added yet. Create your first
                                    question!
                                </p>
                            </div>
                        </div>
                    ) : (
                        questions.map((q, idx) => (
                            <div
                                key={q._id}
                                className="card bg-white shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
                            >
                                <div className="card-body">
                                    {/* Question Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="badge badge-primary badge-lg">
                                                Q{idx + 1}
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-sm">
                                                    {q.points}{" "}
                                                    {q.points === 1
                                                        ? "point"
                                                        : "points"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(q)}
                                                className="btn btn-ghost btn-sm gap-2"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDelete(q._id)
                                                }
                                                className="btn btn-ghost btn-sm gap-2 text-error"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* Question Prompt */}
                                    <p className="text-lg font-medium text-gray-900 mb-4 whitespace-pre-wrap leading-relaxed">
                                        {q.prompt}
                                    </p>

                                    {/* Answer Choices */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {q.choices.map((c, i) => (
                                            <div
                                                key={i}
                                                className={`p-4 rounded-lg border transition-all ${
                                                    c.isCorrect
                                                        ? "bg-green-50 border-green-200"
                                                        : "bg-slate-50 border-slate-200"
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    {c.isCorrect ? (
                                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                                                    )}
                                                    <div className="flex-1">
                                                        <p
                                                            className={`${
                                                                c.isCorrect
                                                                    ? "font-bold text-green-800"
                                                                    : "text-gray-700"
                                                            }`}
                                                        >
                                                            {c.text}
                                                        </p>
                                                        {c.isCorrect && (
                                                            <span className="text-xs font-bold text-green-600 uppercase mt-1 inline-block">
                                                                ✓ Correct Answer
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}

export default QuizQuestionsPage;
