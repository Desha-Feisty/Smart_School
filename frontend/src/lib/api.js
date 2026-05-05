import axios from "axios";

const api = axios.create({
    baseURL: "/api",
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 errors globally
        if (error.response?.status === 401) {
            const isExplicitLogout = localStorage.getItem("isExplicitLogout") === "true";

            if (!isExplicitLogout) {
                const details = error.response?.data?.details;
                const errMsg = error.response?.data?.errMsg;

                if (details === "jwt expired" || errMsg === "unable to verify user") {
                    // Token expired - try to refresh
                    return handleTokenRefresh(error);
                }
            }

            // Clear auth and redirect to login
            localStorage.removeItem("auth-storage");
            localStorage.removeItem("token");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

// Handle token refresh
async function handleTokenRefresh(originalError) {
    const refreshToken = localStorage.getItem("refreshToken");

    if (refreshToken) {
        try {
            const response = await axios.post("/api/auth/refresh", { refreshToken });
            const { token, refreshToken: newRefreshToken } = response.data.data;

            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", newRefreshToken);

            // Retry original request
            originalError.config.headers.Authorization = `Bearer ${token}`;
            return axios(originalError.config);
        } catch {
            // Refresh failed - logout
            localStorage.removeItem("auth-storage");
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
        }
    }

    return Promise.reject(originalError);
}

// Auth API
export const authApi = {
    login: (email, password) => api.post("/auth/login", { email, password }),
    register: (data) => api.post("/auth/register", data),
    logout: () => api.post("/auth/logout"),
    me: () => api.get("/auth/me"),
    refresh: (refreshToken) => api.post("/auth/refresh", { refreshToken }),
};

// Courses API
export const coursesApi = {
    list: (params) => api.get("/courses", { params }),
    get: (id) => api.get(`/courses/${id}`),
    create: (data) => api.post("/courses", data),
    update: (id, data) => api.put(`/courses/${id}`, data),
    delete: (id) => api.delete(`/courses/${id}`),
    join: (joinCode) => api.post("/courses/join", { joinCode }),
    getStudents: (id) => api.get(`/courses/${id}/students`),
};

// Quizzes API
export const quizzesApi = {
    list: (params) => api.get("/quizzes", { params }),
    get: (id) => api.get(`/quizzes/${id}`),
    create: (data) => api.post("/quizzes", data),
    update: (id, data) => api.put(`/quizzes/${id}`, data),
    delete: (id) => api.delete(`/quizzes/${id}`),
    submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
    getAttempts: (id) => api.get(`/quizzes/${id}/attempts`),
};

// Questions API
export const questionsApi = {
    list: (quizId) => api.get("/questions", { params: { quizId } }),
    create: (data) => api.post("/questions", data),
    update: (id, data) => api.put(`/questions/${id}`, data),
    delete: (id) => api.delete(`/questions/${id}`),
};

// Attempts API
export const attemptsApi = {
    list: (params) => api.get("/attempts", { params }),
    get: (id) => api.get(`/attempts/${id}`),
};

// Notes API
export const notesApi = {
    list: (params) => api.get("/notes", { params }),
    get: (id) => api.get(`/notes/${id}`),
    create: (data) => api.post("/notes", data),
    update: (id, data) => api.put(`/notes/${id}`, data),
    delete: (id) => api.delete(`/notes/${id}`),
};

// Comments API
export const commentsApi = {
    list: (noteId) => api.get("/comments", { params: { noteId } }),
    create: (data) => api.post("/comments", data),
    delete: (id) => api.delete(`/comments/${id}`),
};

// Chat API
export const chatApi = {
    list: (courseId) => api.get("/chats", { params: { courseId } }),
    send: (data) => api.post("/chats", data),
};

// Analytics API
export const analyticsApi = {
    overview: () => api.get("/analytics/overview"),
    course: (id) => api.get(`/analytics/course/${id}`),
};

// Leaderboard API
export const leaderboardApi = {
    get: (courseId) => api.get("/leaderboard", { params: { courseId } }),
};

// Notifications API
export const notificationsApi = {
    list: () => api.get("/notifications"),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put("/notifications/read-all"),
};

// Admin API
export const adminApi = {
    listUsers: (params) => api.get("/admin/users", { params }),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default api;