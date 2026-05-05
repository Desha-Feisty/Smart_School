import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { useEffect } from "react";
import useAuthStore from "./stores/Authstore";
import useSocketStore from "./stores/SocketStore";
import useNotificationStore from "./stores/NotificationStore";
import useQuizStore from "./stores/Quizstore";
import useTeacherStore from "./stores/Teacherstore";
import { LoadingPage } from "./components/common/Loading";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Lazy load pages for code splitting
const LoginPage = lazy(() => import("./pages/LoginPage"));
const StudentPage = lazy(() => import("./pages/StudentPage"));
const TeacherPage = lazy(() => import("./pages/TeacherPage"));
const TeacherCoursePage = lazy(() => import("./pages/TeacherCoursePage"));
const QuizQuestionsPage = lazy(() => import("./pages/QuizQuestionsPage"));
const StudentQuizPage = lazy(() => import("./components/StudentQuizPage"));
const QuizResultsPage = lazy(() => import("./components/QuizResultsPage"));
const QuizSubmittedPage = lazy(() => import("./components/QuizSubmittedPage"));
const NoteDetail = lazy(() => import("./components/NoteDetail"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

const processedMessages = new Set();

function SocketListener() {
    const token = useAuthStore((state) => state.token);
    const connect = useSocketStore((state) => state.connect);
    const socket = useSocketStore((state) => state.socket);
    const fetchNotifications = useNotificationStore(
        (state) => state.fetchNotifications,
    );
    const listRecentChats = useTeacherStore((state) => state.listRecentChats);

    useEffect(() => {
        if (token) {
            connect(token);
        }
    }, [token, connect]);

    useEffect(() => {
        if (!socket) return;

        socket.on("new-quiz", (data) => {
            const token = useAuthStore.getState().token;
            if (!token) return;
            fetchNotifications();
            useQuizStore.getState().fetchAvailableQuizzes();
            toast.success(`New Quiz: ${data.title} in ${data.courseTitle}`, {
                duration: 5000,
                icon: "📝",
            });
        });

        socket.on("new-note", (data) => {
            const token = useAuthStore.getState().token;
            if (!token) return;
            fetchNotifications();
            toast.success(`New Note: ${data.title} was posted`, {
                duration: 4000,
                icon: "📖",
            });
        });

        socket.on("chat-message", (message) => {
            const token = useAuthStore.getState().token;
            const currentUser = useAuthStore.getState().user;
            if (!token || !currentUser) return;

            const msgId = message._id || message.id;
            const fallbackId =
                msgId ||
                `${message.text}-${typeof message.sender === "object" ? message.sender._id || message.sender.id : message.sender}`;

            if (processedMessages.has(fallbackId)) return;
            processedMessages.add(fallbackId);

            if (processedMessages.size > 100) {
                const first = processedMessages.values().next().value;
                processedMessages.delete(first);
            }

            fetchNotifications();

            if (currentUser.role === "teacher") {
                listRecentChats(true);
            }

            const myId = currentUser?.id || currentUser?._id;
            const senderId = message.sender?._id || message.sender;

            if (senderId !== myId) {
                const senderName =
                    typeof message.sender === "object"
                        ? message.sender.name
                        : "Teammate";
                toast(`Message from ${senderName}: ${message.text?.substring(0, 30)}...`, {
                    id: message._id,
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
        <ErrorBoundary>
            <Toaster position="top-right" />
            <SocketListener />
            <Suspense fallback={<LoadingPage />}>
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
                    <Route
                        path="/student/quiz/:attemptId/submitted"
                        element={<QuizSubmittedPage />}
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
            </Suspense>
        </ErrorBoundary>
    );
}

export default App;