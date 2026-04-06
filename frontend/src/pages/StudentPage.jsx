import { useEffect, useState } from "react";
import useAuthStore from "../stores/Authstore";
import useTeacherStore from "../stores/Teacherstore";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function StudentPage() {
    const { token, user } = useAuthStore();
    const { allCourses, listMyCourses } = useTeacherStore();
    const navigate = useNavigate();

    const [joinCode, setJoinCode] = useState("");
    const [availableQuizzes, setAvailableQuizzes] = useState([]);
    const [activeTab, setActiveTab] = useState("courses"); // courses, quizzes, grades
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        listMyCourses();
        fetchAvailableQuizzes();
    }, [token, navigate]);

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

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Student Dashboard
                    </h1>
                    <p className="text-gray-600">Welcome back, {user?.name}!</p>
                </div>
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
                                    <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold">
                                        Start Quiz
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === "grades" && (
                <div className="bg-white p-6 rounded-lg border text-center py-12">
                    <p className="text-gray-500 italic">
                        Grade history functionality coming soon...
                    </p>
                </div>
            )}
        </div>
    );
}

export default StudentPage;
