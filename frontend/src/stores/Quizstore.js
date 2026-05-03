import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./Authstore";

const useQuizStore = create((set) => ({
    quizzes: [],
    availableQuizzes: [],
    myGrades: [],
    quizGrades: [],
    currentAttempt: null,
    attemptQuestions: [],
    gradesLoading: false,
    gradesError: null,
    attemptError: null,
    errMsg: null,
    setQuizzes: (quizzes) => set({ quizzes }),
    setErrMsg: (errMsg) => set({ errMsg }),
    clearErrMsg: () => set({ errMsg: null }),

    createQuiz: async (courseId, quizData) => {
        try {
            set({ errMsg: null });
            const token = useAuthStore.getState().token;
            if (!token) {
                const errMsg = "Not authenticated. Please log in again.";
                set({ errMsg });
                throw new Error(errMsg);
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
            const errMsg =
                response.data?.errMsg ||
                response.data?.error ||
                "Failed to create quiz";
            set({ errMsg });
            throw new Error(errMsg);
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to create quiz";
            console.error("Quiz creation error:", errMsg);
            set({ errMsg });
            throw new Error(errMsg);
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

    fetchAvailableQuizzes: async () => {
        try {
            const token = useAuthStore.getState().token;
            const response = await axios.get("/api/quizzes/available", {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ availableQuizzes: response.data.quizzes || [] });
        } catch (error) {
            set({ availableQuizzes: [] });
        }
    },

    listMyGrades: async () => {
        try {
            set({ gradesLoading: true, gradesError: null });
            const token = useAuthStore.getState().token;
            const response = await axios.get("/api/attempts/my-grades", {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ myGrades: response.data.results || [] });
        } catch (error) {
            if (error.response?.status === 404) {
                set({ myGrades: [], gradesError: null });
            } else {
                set({
                    myGrades: [],
                    gradesError:
                        error.response?.data?.errMsg ||
                        error.response?.data?.error ||
                        error.message,
                });
            }
        } finally {
            set({ gradesLoading: false });
        }
    },

    startAttempt: async (quizId) => {
        try {
            set({ attemptError: null });
            const token = useAuthStore.getState().token;
            const response = await axios.post(
                "/api/attempts/start",
                { quizId },
                { headers: { Authorization: `Bearer ${token}` } },
            );

            const attemptData = {
                _id: response.data.attemptId,
                endAt: response.data.endAt,
            };

            set({
                currentAttempt: attemptData,
                attemptQuestions: response.data.questions || [],
            });

            return { attempt: attemptData, questions: response.data.questions };
        } catch (error) {
            set({
                attemptError: error.response?.data?.errMsg || error.message,
            });
            return null;
        }
    },

    fetchAttempt: async (attemptId) => {
        try {
            set({ attemptError: null });
            const token = useAuthStore.getState().token;
            const response = await axios.get(`/api/attempts/${attemptId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const attempt = response.data.attempt;
            let questions;

            if (attempt?.status === "inProgress") {
                const quizResponse = await axios.get(
                    `/api/quizzes/${response.data.quiz._id}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                const quizQuestions = quizResponse.data.questions || [];
                const answeredMap = new Map(
                    (response.data.responses || []).map((r) => [r.questionId, r]),
                );
                questions = quizQuestions.map((q) => {
                    const answered = answeredMap.get(q._id?.toString() || q._id);
                    return answered
                        ? { ...q, selectedChoiceIds: answered.selectedChoiceIds }
                        : q;
                });
            } else {
                questions = (response.data.responses || []).map((r) => ({
                    _id: r.questionId,
                    prompt: r.prompt,
                    points: r.points,
                    choices: r.choices || [],
                    selectedChoiceIds: r.selectedChoiceIds,
                }));
            }

            set({
                currentAttempt: attempt,
                attemptQuestions: questions,
            });

            return response.data;
        } catch (error) {
            set({
                attemptError: error.response?.data?.errMsg || error.message,
            });
            return null;
        }
    },

    submitAnswer: async (attemptId, questionId, selectedChoiceIds) => {
        try {
            const token = useAuthStore.getState().token;
            await axios.patch(
                `/api/attempts/${attemptId}/answers`,
                { questionId, selectedChoiceIds },
                { headers: { Authorization: `Bearer ${token}` } },
            );
            return true;
        } catch (error) {
            console.error("Failed to save answer:", error);
            return false;
        }
    },

    submitAttempt: async (attemptId) => {
        try {
            const token = useAuthStore.getState().token;
            await axios.post(
                `/api/attempts/${attemptId}/submit`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            );
            set({ currentAttempt: null, attemptQuestions: [] });
            return true;
        } catch (error) {
            console.error("Failed to submit attempt:", error);
            return false;
        }
    },

    generateAiQuestions: async (quizId, topic, count) => {
        try {
            set({ errMsg: null });
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
            return response.data;
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to generate AI questions";
            set({ errMsg });
            throw error;
        }
    },

    publishQuiz: async (quizId) => {
        try {
            set({ errMsg: null });
            const token = useAuthStore.getState().token;
            const response = await axios.post(
                `/api/quizzes/${quizId}/publish`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            set((state) => ({
                quizzes: state.quizzes.map((q) =>
                    q._id === quizId ? { ...q, published: true } : q,
                ),
            }));
            return response.data;
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to publish quiz";
            set({ errMsg });
            throw error;
        }
    },

    unpublishQuiz: async (quizId) => {
        try {
            set({ errMsg: null });
            const token = useAuthStore.getState().token;
            const response = await axios.put(
                `/api/quizzes/${quizId}`,
                { published: false },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );
            set((state) => ({
                quizzes: state.quizzes.map((q) =>
                    q._id === quizId ? { ...q, published: false } : q,
                ),
            }));
            return response.data;
        } catch (error) {
            const errMsg =
                error.response?.data?.errMsg ||
                error.response?.data?.error ||
                error.message ||
                "Failed to unpublish quiz";
            set({ errMsg });
            throw error;
        }
    },

    listQuizGrades: async (quizId) => {
        try {
            set({ errMsg: null, gradesLoading: true, gradesError: null });
            const token = useAuthStore.getState().token;
            const response = await axios.get(`/api/quizzes/${quizId}/grades`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ quizGrades: response.data.results || [], gradesLoading: false });
            return response.data;
        } catch (error) {
            set({
                quizGrades: [],
                gradesError: error.response?.data?.errMsg ||
                    error.response?.data?.error ||
                    error.message ||
                    "Failed to fetch quiz grades",
                gradesLoading: false,
            });
            throw error;
        }
    },
}));

export default useQuizStore;
