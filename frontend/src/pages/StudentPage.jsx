import { useEffect, useState } from "react";
import useAuthStore from "../stores/Authstore";
import useTeacherStore from "../stores/Teacherstore";
import useQuizStore from "../stores/Quizstore";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import NoteCard from "../components/NoteCard";

function StudentPage() {
    const { token, user, logout } = useAuthStore();
    const { allCourses, listMyCourses, listCourseNotes } = useTeacherStore();
    const {
        startAttempt,
        attemptError,
        myGrades,
        gradesLoading,
        gradesError,
        listMyGrades,
    } = useQuizStore();
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState("");
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
    const [activeTab, setActiveTab] = useState("courses"); // courses, quizzes, grades, community
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [startingQuizId, setStartingQuizId] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseNotes, setCourseNotes] = useState([]);
    const [notesLoading, setNotesLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        listMyCourses();
        fetchAvailableQuizzes();
    }, [token, navigate]);

    useEffect(() => {
        if (activeTab === "grades") {
            listMyGrades();
        }
    }, [activeTab, listMyGrades]);

    useEffect(() => {
        if (activeTab === "community" && selectedCourse) {
            loadCourseNotes();
        }
    }, [activeTab, selectedCourse]);

    const loadCourseNotes = async () => {
        setNotesLoading(true);
        try {
            const notes = await listCourseNotes(selectedCourse._id);
            setCourseNotes(notes);
        } catch (err) {
            setError(err.message || "Failed to load notes");
        } finally {
            setNotesLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const fetchAvailableQuizzes = async () => {
        try {
            const response = await axios.get("/api/quizzes/available", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAvailableQuizzes(response.data.quizzes || []);
        } catch (err) {
            console.error("Failed to fetch quizzes", err);
        }
    };

    const handleJoinCourse = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await axios.post(
                "/api/courses/join",
                { joinCode },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            setJoinCode("");
            listMyCourses(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.errMsg || "Failed to join course");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartQuiz = async (quizId) => {
        setStartingQuizId(quizId);
        setError(null);
        try {
            const result = await startAttempt(quizId);
            if (result && result.attempt) {
                // Navigate to quiz page with the attempt ID
                navigate(`/student/quiz/${result.attempt._id}`);
            } else {
                setError(attemptError || "Failed to start quiz");
            }
        } catch (err) {
            setError(
                err.message || "An error occurred while starting the quiz",
            );
        } finally {
            setStartingQuizId(null);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Student Dashboard
                    </h1>
                    <p className="text-gray-600">Welcome back, {user?.name}!</p>
                </div>
                <div className="flex flex-col items-end gap-4">
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-200"
                    >
                        Logout
                    </button>
                    <form onSubmit={handleJoinCourse} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Enter Join Code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            className="border p-2 rounded w-40"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 text-white px-4 py-2 rounded font-bold disabled:opacity-50"
                        >
                            {isLoading ? "Joining..." : "Join Course"}
                        </button>
                    </form>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
                    {error}
                </div>
            )}

            <div className="border-b mb-8">
                <div className="flex gap-8">
                    <button
                        onClick={() => setActiveTab("courses")}
                        className={`pb-3 font-semibold ${activeTab === "courses" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                    >
                        My Courses
                    </button>
                    <button
                        onClick={() => setActiveTab("quizzes")}
                        className={`pb-3 font-semibold ${activeTab === "quizzes" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                    >
                        Available Quizzes
                    </button>
                    <button
                        onClick={() => setActiveTab("grades")}
                        className={`pb-3 font-semibold ${activeTab === "grades" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                    >
                        My Grades
                    </button>
                    <button
                        onClick={() => setActiveTab("community")}
                        className={`pb-3 font-semibold ${activeTab === "community" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
                    >
                        Community Notes
                    </button>
                </div>
            </div>

            {activeTab === "courses" && (
                <div>
                    {allCourses.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
                            <p className="text-gray-500 italic">
                                You haven't joined any courses yet. Use a join
                                code to get started!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allCourses.map((course) => (
                                <div
                                    key={course._id}
                                    className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                                >
                                    <div className="p-5">
                                        <h3 className="text-xl font-bold mb-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {course.description}
                                        </p>
                                        <div className="flex justify-between items-center text-xs text-gray-400">
                                            <span>
                                                Joined:{" "}
                                                {new Date(
                                                    course.enrolledAt,
                                                ).toLocaleDateString()}
                                            </span>
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-5 py-3 border-t">
                                        <button className="text-blue-600 font-bold text-sm hover:underline">
                                            View Content &rarr;
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "quizzes" && (
                <div>
                    {availableQuizzes.length === 0 ? (
                        <p className="italic text-gray-500 text-center py-12">
                            No quizzes currently available to take.
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {availableQuizzes.map((quiz) => (
                                <div
                                    key={quiz._id}
                                    className="bg-white p-5 rounded-lg border shadow-sm flex justify-between items-center"
                                >
                                    <div>
                                        <h3 className="text-lg font-bold">
                                            {quiz.title}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            {quiz.description}
                                        </p>
                                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                                            <span>
                                                From: {quiz.course?.title}
                                            </span>
                                            <span>
                                                Ends:{" "}
                                                {new Date(
                                                    quiz.closeAt,
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleStartQuiz(quiz._id)
                                        }
                                        disabled={startingQuizId === quiz._id}
                                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded font-bold transition-colors"
                                    >
                                        {startingQuizId === quiz._id
                                            ? "Starting..."
                                            : "Start Quiz"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "grades" && (
                <div className="bg-white p-6 rounded-lg border">
                    <h2 className="text-2xl font-bold mb-4">
                        My Grade History
                    </h2>
                    {gradesLoading ? (
                        <div className="text-center py-12 text-gray-600">
                            Loading grades...
                        </div>
                    ) : gradesError ? (
                        <div className="text-red-600 py-6">{gradesError}</div>
                    ) : myGrades.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No graded attempts available yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Quiz
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Course
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Score
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {myGrades.map((grade) => (
                                        <tr key={grade.attemptId}>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {grade.quiz?.title ||
                                                    "Unnamed Quiz"}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {grade.course?.title ||
                                                    "Unknown Course"}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {grade.score}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {grade.submittedAt
                                                    ? new Date(
                                                          grade.submittedAt,
                                                      ).toLocaleString()
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                <span
                                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        grade.status ===
                                                        "graded"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                    }`}
                                                >
                                                    {grade.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "community" && (
                <div>
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-4">
                            Community Notes
                        </h2>
                        <select
                            value={selectedCourse?._id || ""}
                            onChange={(e) => {
                                const course = allCourses.find(
                                    (c) => c._id === e.target.value,
                                );
                                setSelectedCourse(course);
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select a course</option>
                            {allCourses.map((course) => (
                                <option key={course._id} value={course._id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedCourse && (
                        <div>
                            {notesLoading ? (
                                <p className="text-center text-gray-500 py-8">
                                    Loading notes...
                                </p>
                            ) : courseNotes.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    No notes posted yet for this course.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {courseNotes.map((note) => (
                                        <NoteCard
                                            key={note._id}
                                            note={note}
                                            isTeacher={false}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default StudentPage;
