import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import StudentPage from "./pages/StudentPage";
import TeacherPage from "./pages/TeacherPage";
import TeacherCoursePage from "./pages/TeacherCoursePage";
import QuizQuestionsPage from "./pages/QuizQuestionsPage";
import StudentQuizPage from "./components/StudentQuizPage";
import QuizResultsPage from "./components/QuizResultsPage";
import NoteDetail from "./components/NoteDetail";
import AdminDashboard from "./pages/AdminDashboard";
import useAuthStore from "./stores/Authstore";
import useSocketStore from "./stores/SocketStore";
import useNotificationStore from "./stores/NotificationStore";
import useTeacherStore from "./stores/Teacherstore";

const processedMessages = new Set();

function SocketListener() {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const connect = useSocketStore((state) => state.connect);
    const socket = useSocketStore((state) => state.socket);
    const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
    const listRecentChats = useTeacherStore((state) => state.listRecentChats);

    useEffect(() => {
        if (token) {
            connect(token);
        }
    }, [token, connect]);

    useEffect(() => {
        if (!socket) return;

        socket.on("new-quiz", (data) => {
            fetchNotifications();
            useQuizStore.getState().fetchAvailableQuizzes();
            toast.success(`🚀 New Quiz: ${data.title} in ${data.courseTitle}`, {
                duration: 5000,
                icon: "📝"
            });
        });

        socket.on("new-note", (data) => {
            fetchNotifications();
            toast.success(`📚 New Note: ${data.title} was posted`, {
                duration: 4000,
                icon: "📖"
            });
        });

        socket.on("chat-message", (message) => {
            // Deduplicate incoming messages using a global Set
            const msgId = message._id || message.id;
            const fallbackId = msgId || `${message.text}-${typeof message.sender === 'object' ? message.sender._id || message.sender.id : message.sender}`;
            
            if (processedMessages.has(fallbackId)) return;
            processedMessages.add(fallbackId);
            // Keep set size manageable
            if (processedMessages.size > 100) {
                const first = processedMessages.values().next().value;
                processedMessages.delete(first);
            }

            fetchNotifications();
            
            const currentUser = useAuthStore.getState().user;
            if (currentUser?.role === "teacher") {
                listRecentChats();
            }

            // Only show toast if window is NOT active/visible or something
            // For now, just show a simple toast
            const myId = currentUser?.id || currentUser?._id;
            const senderId = message.sender?._id || message.sender;
            
            if (senderId !== myId) {
                const senderName = typeof message.sender === 'object' ? message.sender.name : "Teammate";
                toast(`💬 Message from ${senderName}: ${message.text?.substring(0, 30)}...`, {
                    id: message._id, // Add id to toast for extra deduplication safety
                    duration: 3000,
                });
            }
        });

        return () => {
            socket.off("new-quiz");
            socket.off("new-note");
            socket.off("chat-message");
        };
    }, [socket]);

    return null;
}

function App() {
    return (
        <>
            <Toaster position="top-right" />
            <SocketListener />
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/student" element={<StudentPage />} />
                <Route
                    path="/student/quiz/:attemptId"
                    element={<StudentQuizPage />}
                />
                <Route
                    path="/student/quiz/:attemptId/results"
                    element={<QuizResultsPage />}
                />
                <Route path="/teacher" element={<TeacherPage />} />
                <Route
                    path="/teacher/course/:id"
                    element={<TeacherCoursePage />}
                />
                <Route
                    path="/teacher/quiz/:id/questions"
                    element={<QuizQuestionsPage />}
                />
                <Route path="/note/:noteId" element={<NoteDetail />} />
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </>
    );
}

export default App;
