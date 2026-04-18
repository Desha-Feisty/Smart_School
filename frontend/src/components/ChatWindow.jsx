import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Send, X } from "lucide-react";
import useAuthStore from "../stores/Authstore";
import toast from "react-hot-toast";

function ChatWindow({ courseId, peerId, peerName, onClose }) {
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const userId = user?.id || user?._id;
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [status, setStatus] = useState("connecting");
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    const backendUrl =
        import.meta.env.VITE_BACKEND_URL ||
        (window.location.hostname === "localhost"
            ? "http://localhost:3000"
            : window.location.origin);

    useEffect(() => {
        if (!token || !courseId || !peerId) return;

        const socket = io(backendUrl, {
            auth: { token },
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setStatus("connected");
            socket.emit("join-chat", { courseId, peerId });
        });

        socket.on("disconnect", () => {
            setStatus("disconnected");
        });

        socket.on("chat-history", ({ messages: history }) => {
            setMessages(history || []);
        });

        socket.on("chat-message", (message) => {
            setMessages((prev) => [...prev, message]);
        });

        socket.on("socket-error", ({ message }) => {
            toast.error(message || "Chat error");
        });

        socket.on("connect_error", (error) => {
            toast.error(error.message || "Socket connection failed");
        });

        return () => {
            socket.disconnect();
        };
    }, [backendUrl, courseId, peerId, token]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSend = () => {
        if (!text.trim()) return;
        const socket = socketRef.current;
        if (!socket) return;

        socket.emit("send-chat-message", {
            courseId,
            recipientId: peerId,
            text: text.trim(),
        });
        setText("");
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none mb-14 sm:mb-0">
            <div className="w-[350px] max-h-[70vh] rounded-2xl glass-panel overflow-hidden pointer-events-auto flex flex-col shadow-blue-500/10">
                <div className="flex items-center justify-between gap-4 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md px-5 py-4 border-b border-slate-200 dark:border-slate-700/50">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Chat with {peerName || "Teacher"}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            {status === "connected"
                                ? "Connected"
                                : "Connecting..."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-circle btn-sm text-slate-600 dark:text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50/50 dark:bg-base-200/50 backdrop-blur-sm">
                    {messages.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-20">
                            No messages yet. Start the conversation.
                        </div>
                    ) : (
                        messages.map((message) => {
                            const messageSenderId =
                                typeof message.sender === "object"
                                    ? message.sender._id || message.sender.id
                                    : message.sender;
                            const isMine = messageSenderId === userId;
                            return (
                                <div
                                    key={
                                        message._id ||
                                        `${messageSenderId}-${message.createdAt}`
                                    }
                                    className={`flex ${isMine ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${isMine ? "bg-blue-600 text-white rounded-br-none" : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-bl-none"}`}
                                    >
                                        <div className={`text-xs mb-1 ${isMine ? "text-blue-200" : "text-slate-500 dark:text-slate-400"}`}>
                                            {isMine
                                                ? "You"
                                                : message.sender?.name ||
                                                  peerName}
                                        </div>
                                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                            {message.text}
                                        </div>
                                        <div className={`mt-1 text-[10px] text-right ${isMine ? "text-blue-300" : "text-slate-400 dark:text-slate-500"}`}>
                                            {new Date(
                                                message.createdAt,
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md">
                    <div className="flex gap-2">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                            placeholder="Message..."
                            className="textarea textarea-bordered flex-1 min-h-[2.5rem] bg-slate-50 dark:bg-base-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 py-2"
                        />
                        <button
                            onClick={handleSend}
                            className="btn btn-primary btn-circle shadow-lg shadow-blue-500/30"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatWindow;
