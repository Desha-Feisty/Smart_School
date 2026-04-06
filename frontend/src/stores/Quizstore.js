import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./Authstore";

const useQuizStore = create((set) => ({
    quizzes: [],
    errMsg: null,
    setQuizzes: (quizzes) => set({ quizzes }),
    setErrMsg: (errMsg) => set({ errMsg }),
    clearErrMsg: () => set({ errMsg: null }),

    createQuiz: async (courseId, quizData) => {
        try {
            set({ errMsg: null });
            const token = useAuthStore.getState().token;
            const response = await axios.post(
                `/api/quizzes/${courseId}/quizzes`,
                quizData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            if (response.status === 201) {
                set((state) => ({
                    quizzes: [...state.quizzes, response.data.quiz],
                }));
                return response.data;
            }
        } catch (error) {
            set({
                errMsg:
                    error.response?.data?.errMsg ||
                    error.response?.data?.error ||
                    error.message,
            });
        }
    },

    listCourseQuizzes: async (courseId) => {
        try {
            set({ errMsg: null });
            const token = useAuthStore.getState().token;
            const response = await axios.get(
                `/api/quizzes/course/${courseId}`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            if (response.status === 200) {
                set({ quizzes: response.data.filteredQuizzes });
            }
        } catch (error) {
            set({
                errMsg:
                    error.response?.data?.errMsg ||
                    error.response?.data?.error ||
                    error.message,
            });
        }
    },

    deleteQuiz: async (quizId) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.delete(`/api/quizzes/${quizId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status === 200) {
                set((state) => ({
                    quizzes: state.quizzes.filter((q) => q._id !== quizId),
                }));
            }
        } catch (error) {
            set({ errMsg: error.message });
        }
    },
}));

export default useQuizStore;
