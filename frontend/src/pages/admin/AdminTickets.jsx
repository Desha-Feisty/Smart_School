import { useState, useEffect } from "react";
import axios from "axios";
import useAuthStore from "../../stores/Authstore";
import toast from "react-hot-toast";
import {
    MessageSquare,
    Clock,
    CheckCircle,
    AlertCircle,
    Send,
    User,
} from "lucide-react";
import PageWrapper from "../../components/layout/PageWrapper";

function AdminTickets() {
    const { token } = useAuthStore();
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [respondingTo, setRespondingTo] = useState(null);
    const [adminReply, setAdminReply] = useState("");

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get("/api/tickets/all", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setTickets(res.data.tickets || []);
        } catch (err) {
            console.error("Failed to fetch tickets:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchTickets();
        }
    }, [token]);

    const handleRespond = async (ticketId) => {
        if (!adminReply.trim()) {
            toast.error("Please enter a response");
            return;
        }
        try {
            await axios.patch(
                `/api/tickets/${ticketId}/respond`,
                { adminReply },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("Response sent successfully");
            setRespondingTo(null);
            setAdminReply("");
            fetchTickets();
        } catch (err) {
            toast.error(err.response?.data?.errMsg || "Failed to send response");
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
    };

    return (
        <PageWrapper>
            <main className="max-w-5xl mx-auto px-6 py-8 animate-in fade-in duration-500">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-blue-500" />
                        Support Tickets
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        View and respond to user support tickets
                    </p>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <span className="loading loading-spinner loading-lg text-blue-500"></span>
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-base-200 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">No tickets yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tickets.map((ticket) => (
                            <div
                                key={ticket._id}
                                className="bg-white dark:bg-base-200 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"
                            >
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {ticket.user?.name || "Unknown User"}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {ticket.user?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`badge ${
                                            ticket.status === "open"
                                                ? "badge-warning"
                                                : "badge-success"
                                        }`}
                                    >
                                        {ticket.status === "open" ? (
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                        ) : (
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                        )}
                                        {ticket.status}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                    {ticket.subject}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-4">
                                    {ticket.message}
                                </p>

                                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-4">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(ticket.createdAt)}
                                </div>

                                {ticket.adminReply && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Admin Response:
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {ticket.adminReply}
                                        </p>
                                    </div>
                                )}

                                {ticket.status === "open" && !respondingTo && (
                                    <button
                                        onClick={() => setRespondingTo(ticket._id)}
                                        className="btn btn-primary btn-sm rounded-xl mt-4"
                                    >
                                        <Send className="w-4 h-4 mr-2" />
                                        Respond
                                    </button>
                                )}

                                {respondingTo === ticket._id && (
                                    <div className="mt-4">
                                        <textarea
                                            className="textarea textarea-bordered rounded-xl w-full h-24"
                                            placeholder="Type your response..."
                                            value={adminReply}
                                            onChange={(e) =>
                                                setAdminReply(e.target.value)
                                            }
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() =>
                                                    handleRespond(ticket._id)
                                                }
                                                className="btn btn-primary btn-sm rounded-xl"
                                            >
                                                <Send className="w-4 h-4 mr-2" />
                                                Send Response
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setRespondingTo(null);
                                                    setAdminReply("");
                                                }}
                                                className="btn btn-ghost btn-sm rounded-xl"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </PageWrapper>
    );
}

export default AdminTickets;