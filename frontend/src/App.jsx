import { Route, Routes } from "react-router-dom";
import { Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";

import StudentPage from "./pages/StudentPage";
import TeacherPage from "./pages/TeacherPage";
import TeacherCoursePage from "./pages/TeacherCoursePage";
import QuizQuestionsPage from "./pages/QuizQuestionsPage";
import StudentQuizPage from "./components/StudentQuizPage";
import QuizResultsPage from "./components/QuizResultsPage";
import NoteDetail from "./components/NoteDetail";

function App() {
    return (
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
            <Route path="/teacher/course/:id" element={<TeacherCoursePage />} />
            <Route
                path="/teacher/quiz/:id/questions"
                element={<QuizQuestionsPage />}
            />
            <Route path="/note/:noteId" element={<NoteDetail />} />
        </Routes>
    );
}

export default App;
