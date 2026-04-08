import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useQuizStore from "../stores/Quizstore";
import useAuthStore from "../stores/Authstore";

function QuizQuestionsPage() {
    const { id: quizId } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const { listQuizQuestions, addQuestion, updateQuestion, deleteQuestion, errMsg, clearErrMsg } = useQuizStore();

    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        prompt: "",
        points: 1,
        choices: [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
        ],
    });

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchQuestions();
    }, [quizId, token, navigate]);

    const fetchQuestions = async () => {
        setIsLoading(true);
        const data = await listQuizQuestions(quizId);
        setQuestions(data);
        setIsLoading(false);
    };

    const handleChoiceChange = (index, field, value) => {
        const newChoices = [...formData.choices];
        newChoices[index][field] = value;
        
        // If setting isCorrect to true, set all others to false
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
        if (formData.choices.length <= 2) return;
        const newChoices = formData.choices.filter((_, i) => i !== index);
        // Ensure at least one is correct
        if (!newChoices.some(c => c.isCorrect)) {
            newChoices[0].isCorrect = true;
        }
        setFormData({ ...formData, choices: newChoices });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateQuestion(editingId, formData);
            } else {
                await addQuestion(quizId, formData);
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
            // Error handled by store
        }
    };

    const handleEdit = (q) => {
        setFormData({
            prompt: q.prompt,
            points: q.points,
            choices: q.choices.map(c => ({ text: c.text, isCorrect: c.isCorrect })),
        });
        setEditingId(q._id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (questionId) => {
        if (window.confirm("Are you sure you want to delete this question?")) {
            try {
                await deleteQuestion(questionId);
                fetchQuestions();
            } catch (err) {}
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading questions...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline mb-2 block">
                        &larr; Back to Quiz
                    </button>
                    <h1 className="text-3xl font-bold">Manage Quiz Questions</h1>
                </div>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded font-bold"
                    >
                        Add Question
                    </button>
                )}
            </div>

            {errMsg && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                    {errMsg}
                    <button onClick={clearErrMsg} className="absolute top-0 right-0 p-3">&times;</button>
                </div>
            )}

            {isAdding && (
                <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
                    <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Question" : "New Multiple Choice Question"}</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold mb-1">Question Prompt</label>
                            <textarea 
                                required
                                value={formData.prompt}
                                onChange={(e) => setFormData({...formData, prompt: e.target.value})}
                                className="w-full border p-3 rounded h-24"
                                placeholder="Enter your question here..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">Points</label>
                            <input 
                                type="number" 
                                min="0"
                                value={formData.points}
                                onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                                className="w-24 border p-2 rounded"
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <label className="block text-sm font-bold">Choices (Select the correct one)</label>
                            {formData.choices.map((choice, index) => (
                                <div key={index} className="flex gap-3 items-center">
                                    <input 
                                        type="radio" 
                                        name="correct-choice"
                                        checked={choice.isCorrect}
                                        onChange={() => handleChoiceChange(index, "isCorrect", true)}
                                        className="w-5 h-5 text-blue-600"
                                    />
                                    <input 
                                        type="text" 
                                        required
                                        value={choice.text}
                                        onChange={(e) => handleChoiceChange(index, "text", e.target.value)}
                                        className="flex-grow border p-2 rounded"
                                        placeholder={`Choice ${index + 1}`}
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => removeChoice(index)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded"
                                        title="Remove choice"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                            <button 
                                type="button"
                                onClick={addChoice}
                                className="text-blue-600 text-sm font-bold hover:underline"
                            >
                                + Add Choice
                            </button>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button type="submit" className="bg-green-600 text-white px-8 py-2 rounded font-bold">
                                {editingId ? "Update Question" : "Create Question"}
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    setIsAdding(false);
                                    setEditingId(null);
                                    setFormData({
                                        prompt: "",
                                        points: 1,
                                        choices: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }],
                                    });
                                }}
                                className="bg-gray-200 px-8 py-2 rounded font-bold"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-bold mb-4">Questions ({questions.length})</h2>
                {questions.length === 0 ? (
                    <div className="bg-gray-50 p-12 text-center rounded-lg border-2 border-dashed">
                        <p className="text-gray-500 italic">No questions added yet.</p>
                    </div>
                ) : (
                    questions.map((q, idx) => (
                        <div key={q._id} className="bg-white p-5 rounded-lg border shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-3">
                                    <span className="bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded text-sm">Q{idx + 1}</span>
                                    <span className="text-gray-500 text-sm font-medium">{q.points} {q.points === 1 ? 'point' : 'points'}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(q)} className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded text-sm font-bold border border-blue-600">Edit</button>
                                    <button onClick={() => handleDelete(q._id)} className="text-red-600 hover:bg-red-50 px-3 py-1 rounded text-sm font-bold border border-red-600">Delete</button>
                                </div>
                            </div>
                            <p className="font-medium text-lg mb-4 whitespace-pre-wrap">{q.prompt}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {q.choices.map((c, i) => (
                                    <div key={i} className={`p-3 rounded border flex items-center gap-3 ${c.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className={`w-3 h-3 rounded-full ${c.isCorrect ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <span className={c.isCorrect ? 'font-bold text-green-800' : 'text-gray-700'}>{c.text}</span>
                                        {c.isCorrect && <span className="ml-auto text-xs font-bold text-green-600 uppercase">Correct</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default QuizQuestionsPage;
