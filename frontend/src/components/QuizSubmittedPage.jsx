import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import PageWrapper from "./layout/PageWrapper";
import Navbar from "./layout/Navbar";

function QuizSubmittedPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [timeRemaining, setTimeRemaining] = useState(null);

    const quizEndAt = location.state?.quizEndAt;

    useEffect(() => {
        if (!quizEndAt) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const endTime = new Date(quizEndAt).getTime();
            const remaining = Math.max(0, endTime - now);
            setTimeRemaining(remaining);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [quizEndAt]);

    const formatTime = (ms) => {
        if (ms === null) return "--:--:--";
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "Unknown";
        return new Date(dateStr).toLocaleString();
    };

    return (
        <PageWrapper>
            <Navbar />
            <div className="min-h-[80vh] flex items-center justify-center px-6 relative z-10">
                <div className="glass-panel max-w-md w-full border border-white/40 dark:border-slate-700/50 shadow-xl rounded-3xl p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                        Quiz Submitted Successfully!
                    </h2>
                    
                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        Your answers have been saved. Your results will be available after the quiz closes.
                    </p>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6">
                        <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                            <Clock className="w-5 h-5" />
                            <span className="font-medium">Time Until Results</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {timeRemaining !== null && timeRemaining > 0 
                                ? formatTime(timeRemaining) 
                                : "Quiz Closed"}
                        </div>
                    </div>

                    {quizEndAt && (
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-500 mb-6">
                            <Calendar className="w-4 h-4" />
                            <span>Quiz closes: {formatDate(quizEndAt)}</span>
                        </div>
                    )}

                    <button
                        onClick={() => navigate("/student")}
                        className="btn btn-primary gap-2"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </PageWrapper>
    );
}

export default QuizSubmittedPage;