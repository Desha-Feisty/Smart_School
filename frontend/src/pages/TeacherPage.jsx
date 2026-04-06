import { useEffect, useState } from "react";
import useTeacherStore from "../stores/Teacherstore";
import useAuthStore from "../stores/Authstore";
import { useNavigate } from "react-router-dom";

function TeacherPage() {
    const {
        allCourses,
        errMsg,
        listMyCourses,
        createCourse,
        deleteCourse,
        clearErrMsg,
    } = useTeacherStore();

    const token = useAuthStore((state) => state.token);
    const navigate = useNavigate();

    const [newCourse, setNewCourse] = useState({ title: "", description: "" });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        listMyCourses();
    }, [listMyCourses, token, navigate]);

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        if (!newCourse.title || !newCourse.description) return;
        setIsLoading(true);
        await createCourse(newCourse.title, newCourse.description);
        setNewCourse({ title: "", description: "" });
        setIsLoading(false);
    };

    const handleDeleteCourse = async (id) => {
        if (window.confirm("Are you sure you want to delete this course?")) {
            await deleteCourse(id);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Teacher Dashboard</h1>

            {/* Error Message Section */}
            {errMsg && (
                <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
                    role="alert"
                >
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{errMsg}</span>
                    <button
                        onClick={clearErrMsg}
                        className="absolute top-0 bottom-0 right-0 px-4 py-3"
                    >
                        <span className="text-xl">&times;</span>
                    </button>
                </div>
            )}

            {/* Create Course Form Section */}
            <section className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8 border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    Create New Course
                </h2>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                    <div>
                        <label
                            className="block text-gray-700 text-sm font-bold mb-2"
                            htmlFor="title"
                        >
                            Course Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            placeholder="e.g., Advanced React Patterns"
                            value={newCourse.title}
                            onChange={(e) =>
                                setNewCourse({
                                    ...newCourse,
                                    title: e.target.value,
                                })
                            }
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label
                            className="block text-gray-700 text-sm font-bold mb-2"
                            htmlFor="description"
                        >
                            Description
                        </label>
                        <textarea
                            id="description"
                            placeholder="Describe what students will learn..."
                            value={newCourse.description}
                            onChange={(e) =>
                                setNewCourse({
                                    ...newCourse,
                                    description: e.target.value,
                                })
                            }
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-200 disabled:opacity-50"
                    >
                        {isLoading ? "Creating..." : "Create Course"}
                    </button>
                </form>
            </section>

            {/* Course List Section */}
            <section>
                <h2 className="text-xl font-semibold mb-4 text-gray-800">
                    My Courses
                </h2>
                {allCourses.length === 0 ? (
                    <p className="text-gray-500 italic">
                        No courses created yet. Start by creating one above!
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {allCourses.map((course) => (
                            <div
                                key={course._id || course.id}
                                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
                            >
                                <div
                                    className="p-5 grow cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() =>
                                        navigate(
                                            `/teacher/course/${course._id || course.id}`,
                                        )
                                    }
                                >
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                                        {course.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm line-clamp-3">
                                        {course.description}
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-between items-center">
                                    <button
                                        onClick={() =>
                                            handleDeleteCourse(
                                                course._id || course.id,
                                            )
                                        }
                                        className="text-red-600 hover:text-red-800 text-sm font-semibold transition-colors duration-200"
                                    >
                                        Delete Course
                                    </button>
                                    <span className="text-gray-400 text-xs uppercase tracking-wider font-medium">
                                        ID: {course._id || course.id}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default TeacherPage;
