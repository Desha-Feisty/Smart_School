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
            if (!token) {
                set({ errMsg: "Not authenticated. Please log in again." });
                return;
            }
            console.log("Creating quiz for course:", courseId);
            console.log("Quiz data:", JSON.stringify(quizData, null, 2));
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
            console.log("Quiz creation response:", response.data);
            if (response.status === 201) {
                set((state) => ({
                    quizzes: [...state.quizzes, response.data.quiz],
                }));
                return response.data;
            }
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to create quiz";
            console.error("Quiz creation error:", errMsg);
            set({ errMsg });
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

    listQuizQuestions: async (quizId) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.get(`/api/quizzes/${quizId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            // The backend returns { quiz, questions }
            return response.data.questions || [];
        } catch (error) {
            set({ errMsg: error.message });
            return [];
        }
    },

    addQuestion: async (quizId, questionData) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.post(
                `/api/quizzes/${quizId}/questions`,
                questionData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return response.data.question;
        } catch (error) {
            set({ errMsg: error.response?.data?.errMsg || error.message });
            throw error;
        }
    },

    updateQuestion: async (questionId, questionData) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.put(
                `/api/questions/${questionId}`,
                questionData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return response.data.question;
        } catch (error) {
            set({ errMsg: error.response?.data?.errMsg || error.message });
            throw error;
        }
    },

    deleteQuestion: async (questionId) => {
        try {
            const token = useAuthStore.getState().token;
            await axios.delete(`/api/questions/${questionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (error) {
            set({ errMsg: error.response?.data?.errMsg || error.message });
            throw error;
        }
    },
}));

export default useQuizStore;
