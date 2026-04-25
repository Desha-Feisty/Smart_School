import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./Authstore";

const useQuizStore = create((set) => ({
    quizzes: [],
    availableQuizzes: [],
    errMsg: null,
    setQuizzes: (quizzes) => set({ quizzes }),
    setAvailableQuizzes: (availableQuizzes) => set({ availableQuizzes }),
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

    fetchAvailableQuizzes: async () => {
        try {
            set({ errMsg: null });
            const token = useAuthStore.getState().token;
            if (!token) return;
            const response = await axios.get("/api/quizzes/available", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                set({ availableQuizzes: response.data.quizzes || [] });
            }
        } catch (error) {
            console.error("Failed to fetch available quizzes:", error);
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

    publishQuiz: async (quizId) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.post(
                `/api/quizzes/${quizId}/publish`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (response.status === 200) {
                set((state) => ({
                    quizzes: state.quizzes.map((q) =>
                        q._id === quizId ? { ...q, published: true } : q,
                    ),
                }));
            }
        } catch (error) {
            set({ errMsg: error.response?.data?.errMsg || error.message });
        }
    },

    unpublishQuiz: async (quizId) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.put(
                `/api/quizzes/${quizId}`,
                { published: false },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (response.status === 200) {
                set((state) => ({
                    quizzes: state.quizzes.map((q) =>
                        q._id === quizId ? { ...q, published: false } : q,
                    ),
                }));
            }
        } catch (error) {
            set({ errMsg: error.response?.data?.errMsg || error.message });
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

    generateAiQuestions: async (quizId, topic, count) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.post(
                `/api/quizzes/${quizId}/questions/generate-ai`,
                { topic, count },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            return response.data.questions;
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

    // Grade history state
    myGrades: [],
    quizGrades: [],
    gradesLoading: false,
    gradesError: null,

    listMyGrades: async () => {
        try {
            set({ gradesLoading: true, gradesError: null });
            const token = useAuthStore.getState().token;
            if (!token) {
                set({ gradesError: "Not authenticated. Please log in again." });
                return [];
            }
            const response = await axios.get("/api/attempts/my", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                set({ myGrades: response.data.results || [] });
                return response.data.results || [];
            }
            return [];
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to load grades";
            if (error.response?.status === 404) {
                set({ myGrades: [] });
                return [];
            }
            console.error("List my grades error:", errMsg);
            set({ gradesError: errMsg });
            return [];
        } finally {
            set({ gradesLoading: false });
        }
    },

    listQuizGrades: async (quizId) => {
        try {
            set({ gradesLoading: true, gradesError: null });
            const token = useAuthStore.getState().token;
            if (!token) {
                set({ gradesError: "Not authenticated. Please log in again." });
                return [];
            }
            const response = await axios.get(`/api/quizzes/${quizId}/grades`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.status === 200) {
                set({ quizGrades: response.data.results || [] });
                return response.data;
            }
            return null;
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to load quiz grades";
            console.error("List quiz grades error:", errMsg);
            set({ gradesError: errMsg });
            set({ quizGrades: [] });
            return null;
        } finally {
            set({ gradesLoading: false });
        }
    },

    // Student Attempt Actions
    currentAttempt: null,
    attemptQuestions: [],
    attemptError: null,

    startAttempt: async (quizId) => {
        try {
            set({ attemptError: null });
            const token = useAuthStore.getState().token;
            if (!token) {
                set({
                    attemptError: "Not authenticated. Please log in again.",
                });
                return null;
            }
            const response = await axios.post(
                `/api/attempts/${quizId}/attempts/start`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (response.status === 201 || response.status === 200) {
                // Backend returns: { attemptId, endAt, questions }
                const attemptData = {
                    _id: response.data.attemptId,
                    endAt: response.data.endAt,
                };
                // Transform questions to use _id instead of id
                const transformedQuestions = (
                    response.data.questions || []
                ).map((q) => ({
                    _id: q.id,
                    prompt: q.prompt,
                    choices: q.choices.map((c) => ({
                        _id: c.id,
                        text: c.text,
                    })),
                }));
                set({
                    currentAttempt: attemptData,
                    attemptQuestions: transformedQuestions,
                });
                return {
                    attempt: attemptData,
                    questions: transformedQuestions,
                };
            }
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to start quiz attempt";
            console.error("Start attempt error:", errMsg);
            set({ attemptError: errMsg });
            return null;
        }
    },

    submitAnswer: async (attemptId, questionId, selectedChoiceIds) => {
        try {
            set({ attemptError: null });
            const token = useAuthStore.getState().token;
            if (!token) {
                set({ attemptError: "Not authenticated." });
                return false;
            }
            const response = await axios.patch(
                `/api/attempts/${attemptId}/answers`,
                {
                    questionId,
                    selectedChoiceIds,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (response.status === 200) {
                return true;
            }
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to save answer";
            console.error("Submit answer error:", errMsg);
            set({ attemptError: errMsg });
            return false;
        }
    },

    submitAttempt: async (attemptId) => {
        try {
            set({ attemptError: null });
            const token = useAuthStore.getState().token;
            if (!token) {
                set({ attemptError: "Not authenticated." });
                return null;
            }
            const response = await axios.post(
                `/api/attempts/${attemptId}/submit`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (response.status === 200) {
                set({
                    currentAttempt: response.data.attempt,
                });
                return response.data.attempt;
            }
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to submit quiz";
            console.error("Submit attempt error:", errMsg);
            set({ attemptError: errMsg });
            return null;
        }
    },
}));

export default useQuizStore;
