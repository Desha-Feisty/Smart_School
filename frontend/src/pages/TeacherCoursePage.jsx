import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useTeacherStore from "../stores/Teacherstore";
import useQuizStore from "../stores/Quizstore";
import useAuthStore from "../stores/Authstore";

function TeacherCoursePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const {
        allCourses,
        updateCourse,
        deleteCourse,
        getCourse,
        errMsg,
        clearErrMsg,
    } = useTeacherStore();
    const {
        quizzes,
        createQuiz,
        listCourseQuizzes,
        deleteQuiz,
        errMsg: quizErrMsg,
        clearErrMsg: clearQuizErrMsg,
    } = useQuizStore();

    const [course, setCourse] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ title: "", description: "" });
    const [newQuiz, setNewQuiz] = useState({
        title: "",
        description: "",
        openAt: "",
        closeAt: "",
        durationMinutes: 30,
        attemptsAllowed: 1,
    });
    const [activeTab, setActiveTab] = useState("quizzes"); // quizzes, grades, settings

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        const currentCourse = allCourses.find((c) => (c._id || c.id) === id);
        if (!currentCourse) {
            getCourse(id);
        }
        listCourseQuizzes(id);
    }, [id, token, navigate]);

    useEffect(() => {
        const currentCourse = allCourses.find((c) => (c._id || c.id) === id);
        if (currentCourse) {
            setCourse(currentCourse);
            setEditData({
                title: currentCourse.title,
                description: currentCourse.description,
            });
        }
    }, [allCourses, id]);

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        await updateCourse(id, editData.title, editData.description);
        setIsEditing(false);
    };

    const handleDeleteCourse = async () => {
        if (
            window.confirm(
                "Are you sure you want to delete this entire course?",
            )
        ) {
            await deleteCourse(id);
            navigate("/teacher");
        }
    };

    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        await createQuiz(id, newQuiz);
        setNewQuiz({
            title: "",
            description: "",
            openAt: "",
            closeAt: "",
            durationMinutes: 30,
            attemptsAllowed: 1,
        });
    };

    if (!course)
        return <div className="p-8 text-center">Loading course...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <button
                        onClick={() => navigate("/teacher")}
                        className="text-blue-600 hover:underline mb-2 block"
                    >
                        &larr; Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold">{course.title}</h1>
                    <p className="text-gray-600">{course.description}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded font-semibold"
                    >
                        {isEditing ? "Cancel Edit" : "Edit Course"}
                    </button>
                    <button
                        onClick={handleDeleteCourse}
                        className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded font-semibold"
                    >
                        Delete Course
                    </button>
                </div>
            </div>

            {isEditing && (
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
                    <h2 className="text-xl font-bold mb-4">
                        Edit Course Details
                    </h2>
                    <form onSubmit={handleUpdateCourse} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                value={editData.title}
                                onChange={(e) =>
                                    setEditData({
                                        ...editData,
                                        title: e.target.value,
                                    })
                                }
                                className="w-full border p-2 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-1">
                                Description
                            </label>
                            <textarea
                                value={editData.description}
                                onChange={(e) =>
                                    setEditData({
                                        ...editData,
                                        description: e.target.value,
                                    })
                                }
                                className="w-full border p-2 rounded h-24"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white px-6 py-2 rounded font-bold"
                        >
                            Save Changes
                        </button>
                    </form>
                </div>
            )}

            {quizErrMsg && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                    <strong className="font-bold">Quiz Error: </strong>
                    <span>{quizErrMsg}</span>
                    <button
                        onClick={clearQuizErrMsg}
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                    >
                        &times;
                    </button>
                </div>
            )}

            <div className="border-b mb-6">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab("quizzes")}
                        className={`pb-3 font-semibold ${activeTab === "quizzes" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                    >
                        Quizzes
                    </button>
                    <button
                        onClick={() => setActiveTab("grades")}
                        className={`pb-3 font-semibold ${activeTab === "grades" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                    >
                        Student Grades
                    </button>
                </div>
            </div>

            {activeTab === "quizzes" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold mb-4">
                            Course Quizzes
                        </h2>
                        {quizzes.length === 0 ? (
                            <p className="italic text-gray-500">
                                No quizzes created for this course yet.
                            </p>
                        ) : (
                            quizzes.map((quiz) => (
                                <div
                                    key={quiz._id}
                                    className="bg-white p-4 rounded border shadow-sm flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="font-bold text-lg">
                                            {quiz.title}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {quiz.description}
                                        </p>
                                        <div className="text-xs text-gray-400 mt-2">
                                            Open:{" "}
                                            {new Date(
                                                quiz.openAt,
                                            ).toLocaleString()}{" "}
                                            | Close:{" "}
                                            {new Date(
                                                quiz.closeAt,
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded border border-blue-600 text-sm">
                                            Edit Questions
                                        </button>
                                        <button
                                            onClick={() => deleteQuiz(quiz._id)}
                                            className="text-red-600 hover:bg-red-50 px-3 py-1 rounded border border-red-600 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div>
                        <div className="bg-gray-50 p-6 rounded-lg border">
                            <h2 className="text-lg font-bold mb-4">
                                Create New Quiz
                            </h2>
                            <form
                                onSubmit={handleCreateQuiz}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase">
                                        Quiz Title
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
                                        className="w-full border p-2 rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase">
                                        Description
                                    </label>
                                    <textarea
                                        value={newQuiz.description}
                                        onChange={(e) =>
                                            setNewQuiz({
                                                ...newQuiz,
                                                description: e.target.value,
                                            })
                                        }
                                        className="w-full border p-2 rounded text-sm h-20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase">
                                        Open Date
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
                                        className="w-full border p-2 rounded text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 uppercase">
                                        Close Date
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
                                        className="w-full border p-2 rounded text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1 uppercase">
                                            Duration (min)
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={newQuiz.durationMinutes}
                                            onChange={(e) =>
                                                setNewQuiz({
                                                    ...newQuiz,
                                                    durationMinutes: parseInt(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                            className="w-full border p-2 rounded text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 uppercase">
                                            Attempts
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={newQuiz.attemptsAllowed}
                                            onChange={(e) =>
                                                setNewQuiz({
                                                    ...newQuiz,
                                                    attemptsAllowed: parseInt(
                                                        e.target.value,
                                                    ),
                                                })
                                            }
                                            className="w-full border p-2 rounded text-sm"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-2 rounded font-bold text-sm"
                                >
                                    Create Quiz
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "grades" && (
                <div className="bg-white p-6 rounded-lg border">
                    <h2 className="text-xl font-bold mb-4">
                        Student Submissions & Grades
                    </h2>
                    <p className="text-gray-500 italic">
                        Grade reporting functionality coming soon...
                    </p>
                </div>
            )}
        </div>
    );
}

export default TeacherCoursePage;
