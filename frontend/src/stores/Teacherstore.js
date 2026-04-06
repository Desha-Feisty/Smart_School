import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./Authstore";

const useTeacherStore = create((set) => ({
    errMsg: null,
    setErrMsg: (errMsg) => set({ errMsg: errMsg }),
    clearErrMsg: () => set({ errMsg: null }),
    allCourses: [],
    setAllCourses: (allCourses) => set({ allCourses: allCourses }),
    createCourse: async (title, description) => {
        const courseData = { title, description };
        try {
            const response = await axios.post("/api/courses", courseData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${useAuthStore.getState().token}`,
                },
            });
            if (response.status !== 201) {
                throw new Error("Failed to create course");
            }
            const data = response.data.course;
            set((state) => ({ allCourses: [...state.allCourses, data] }));
        } catch (error) {
            set({ errMsg: error.message });
        }
    },
    listMyCourses: async () => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) return;
            const response = await axios.get("/api/courses/my", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status !== 200) {
                throw new Error("Failed to list courses");
            }
            const data = response.data.courses;
            set({ allCourses: data });
        } catch (error) {
            set({ errMsg: error.message });
        }
    },
    getCourse: async (id) => {
        try {
            const response = await axios.get(`/api/courses/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${useAuthStore.getState().token}`,
                },
            });
            if (response.status !== 200) {
                throw new Error("Failed to get course");
            }
            const data = response.data.course;
            set((state) => {
                const exists = state.allCourses.find(
                    (c) => (c._id || c.id) === id,
                );
                if (exists) {
                    return {
                        allCourses: state.allCourses.map((course) =>
                            (course._id || course.id) === id ? data : course,
                        ),
                    };
                } else {
                    return { allCourses: [...state.allCourses, data] };
                }
            });
        } catch (error) {
            set({ errMsg: error.message });
        }
    },
    updateCourse: async (id, title, description) => {
        const courseData = { title, description };
        try {
            const response = await axios.patch(
                `/api/courses/${id}`,
                courseData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${useAuthStore.getState().token}`,
                    },
                },
            );
            if (response.status !== 200) {
                throw new Error("Failed to update course");
            }
            const data = response.data.course;
            set((state) => ({
                allCourses: state.allCourses.map((course) =>
                    (course._id || course.id) === id ? data : course,
                ),
            }));
        } catch (error) {
            set({ errMsg: error.message });
        }
    },

    deleteCourse: async (id) => {
        try {
            const response = await axios.delete(`/api/courses/${id}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${useAuthStore.getState().token}`,
                },
            });
            if (response.status !== 200) {
                throw new Error("Failed to delete course");
            }
            set((state) => ({
                allCourses: state.allCourses.filter(
                    (course) => (course._id || course.id) !== id,
                ),
            }));
        } catch (error) {
            set({ errMsg: error.message });
        }
    },
    listAllCourses: async () => {
        try {
            const response = await axios.get("/api/courses", {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${useAuthStore.getState().token}`,
                },
            });
            if (response.status !== 200) {
                throw new Error("Failed to list courses");
            }
            const data = response.data.courses;
            set((state) => ({ allCourses: [...state.allCourses, ...data] }));
        } catch (error) {
            set({ errMsg: error.message });
        }
    },
    getRoster: async (id) => {
        try {
            const response = await axios.get(`/api/courses/${id}/roster`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${useAuthStore.getState().token}`,
                },
            });
            if (response.status !== 200) {
                throw new Error("Failed to get roster");
            }
            const data = response.data;
            set((state) => ({
                allCourses: state.allCourses.map((course) =>
                    course.id === id ? data : course,
                ),
            }));
        } catch (error) {
            set({ errMsg: error.message });
        }
    },
}));

export default useTeacherStore;
