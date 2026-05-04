import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./Authstore";

const useTeacherStore = create((set) => ({
    errMsg: null,
    setErrMsg: (errMsg) => set({ errMsg: errMsg }),
    clearErrMsg: () => set({ errMsg: null }),
    allCourses: [],
    setAllCourses: (allCourses) => set({ allCourses: allCourses }),
    recentChats: [],
    recentChatsLoading: false,
    createCourse: async (title, description) => {
        // Wait for auth token to be available
        let token = useAuthStore.getState().token;
        let retries = 3;
        while (!token && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
            token = useAuthStore.getState().token;
            retries--;
        }
        
        console.log("Token in createCourse:", token);
        if (!token) {
            set({ errMsg: "Not authenticated. Please log in again." });
            return;
        }
        const courseData = { title, description };
        try {
            const response = await axios.post("/api/courses", courseData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status !== 201) {
                throw new Error("Failed to create course");
            }
            const data = response.data.course;
            set((state) => ({ allCourses: [...state.allCourses, data] }));
        } catch (error) {
            console.error(
                "Create course error:",
                error.response?.data || error.message,
            );
            set({ errMsg: error.response?.data?.errMsg || error.message });
        }
    },
    listMyCourses: async () => {
        try {
            // Wait for auth token to be available
            let token = useAuthStore.getState().token;
            let retries = 3;
            while (!token && retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
                token = useAuthStore.getState().token;
                retries--;
            }
            
            console.log("Token in listMyCourses:", token);
            if (!token) {
                set({ errMsg: "Not authenticated. Please log in again." });
                return;
            }
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
                    (course._id || course.id) === id ? data : course,
                ),
            }));
            return data; // Return the roster data
        } catch (error) {
            set({ errMsg: error.message });
            throw error; // Re-throw so the calling function can handle it
        }
    },

    removeEnrollment: async (courseId, studentId) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await axios.delete(
                `/api/courses/${courseId}/enrollment`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    data: { studentId },
                },
            );

            if (response.status !== 200) {
                throw new Error("Failed to remove student");
            }

            return response.data;
        } catch (error) {
            set({ errMsg: error.message });
            throw error;
        }
    },

    // Community Notes Actions
    createNote: async (courseId, { title, content }) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await axios.post(
                `/api/notes/courses/${courseId}/notes`,
                { title, content },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.status !== 201) {
                throw new Error("Failed to create note");
            }

            return response.data.note;
        } catch (error) {
            throw new Error(error.response?.data?.errMsg || error.message);
        }
    },

    listCourseNotes: async (courseId) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await axios.get(
                `/api/notes/courses/${courseId}/notes`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.status !== 200) {
                throw new Error("Failed to fetch notes");
            }

            return response.data.notes || [];
        } catch (error) {
            throw new Error(error.response?.data?.errMsg || error.message);
        }
    },

    getNoteWithComments: async (noteId) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await axios.get(`/api/notes/${noteId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status !== 200) {
                throw new Error("Failed to fetch note");
            }

            return {
                note: response.data.note,
                comments: response.data.comments,
            };
        } catch (error) {
            throw new Error(error.response?.data?.errMsg || error.message);
        }
    },

    updateNote: async (noteId, { title, content }) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error("Not authenticated");
            }

            const updateData = {};
            if (title) updateData.title = title;
            if (content) updateData.content = content;

            const response = await axios.put(
                `/api/notes/${noteId}`,
                updateData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.status !== 200) {
                throw new Error("Failed to update note");
            }

            return response.data.note;
        } catch (error) {
            throw new Error(error.response?.data?.errMsg || error.message);
        }
    },

    deleteNote: async (noteId) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await axios.delete(`/api/notes/${noteId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status !== 200) {
                throw new Error("Failed to delete note");
            }

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.errMsg || error.message);
        }
    },

    addComment: async (noteId, { content }) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await axios.post(
                `/api/comments/${noteId}/comments`,
                { content },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.status !== 201) {
                throw new Error("Failed to add comment");
            }

            return response.data.comment;
        } catch (error) {
            throw new Error(error.response?.data?.errMsg || error.message);
        }
    },

    deleteComment: async (commentId) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await axios.delete(`/api/comments/${commentId}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status !== 200) {
                throw new Error("Failed to delete comment");
            }

            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.errMsg || error.message);
        }
    },

    updateComment: async (commentId, { content }) => {
        try {
            const token = useAuthStore.getState().token;
            if (!token) {
                throw new Error("Not authenticated");
            }

            const response = await axios.put(
                `/api/comments/${commentId}`,
                { content },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.status !== 200) {
                throw new Error("Failed to update comment");
            }

            return response.data.comment;
        } catch (error) {
            throw new Error(error.response?.data?.errMsg || error.message);
        }
    },

listRecentChats: async (silent = false) => {
        if (!silent) set({ recentChatsLoading: true });
        
        // Get current user ID and token
        const authState = useAuthStore.getState();
        const currentUser = authState.user;
        const currentUserId = currentUser?.id || currentUser?._id;
        const token = authState.token;
        
        if (!token) {
            set({ recentChatsLoading: false });
            return;
        }
        
        try {
            const response = await axios.get("/api/chats/v2/recent", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status !== 200) {
                throw new Error("Failed to list recent chats");
            }
            const data = response.data.results || response.data;
            const conversationList = Object.entries(data)
                .map(([key, convData]) => {
                    const { messages, peer, course, peerId, courseId } =
                        convData;
                    if (!messages || messages.length === 0) return null;

                    const lastMsg = messages[0];
                    const isMine =
                        lastMsg.sender &&
                        (lastMsg.sender._id || lastMsg.sender) ===
                            currentUserId;

                    return {
                        _id: key,
                        peer,
                        course,
                        text: lastMsg.text,
                        createdAt: lastMsg.createdAt,
                        sender: lastMsg.sender,
                        peerId,
                        courseId,
                        messages,
                        isMine,
                    };
                })
                .filter(Boolean)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            set({ recentChats: conversationList, recentChatsLoading: false });
        } catch (error) {
            console.error("List recent chats error:", error);
            set({
                errMsg: error.response?.data?.errMsg || error.message,
                recentChatsLoading: false,
            });
        }
    },
}));

export default useTeacherStore;
