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
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            <div className="w-[350px] max-h-[70vh] rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 pointer-events-auto flex flex-col shadow-blue-500/20">
                <div className="flex items-center justify-between gap-4 bg-slate-100 px-5 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">
                            Chat with {peerName || "Teacher"}
                        </h2>
                        <p className="text-sm text-slate-600">
                            {status === "connected"
                                ? "Connected"
                                : "Connecting..."}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-ghost btn-circle"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-slate-50">
                    {messages.length === 0 ? (
                        <div className="text-center text-sm text-slate-500 py-20">
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
                                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${isMine ? "bg-blue-600 text-white" : "bg-white text-slate-900 border border-slate-200"}`}
                                    >
                                        <div className="text-xs text-slate-400 mb-1">
                                            {isMine
                                                ? "You"
                                                : message.sender?.name ||
                                                  peerName}
                                        </div>
                                        <div className="whitespace-pre-wrap break-words">
                                            {message.text}
                                        </div>
                                        <div className="mt-2 text-[10px] text-slate-400 text-right">
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

                <div className="px-5 py-4 border-t border-slate-200 bg-white">
                    <div className="flex gap-3">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={2}
                            placeholder="Type your message..."
                            className="textarea textarea-bordered flex-1 min-h-[3rem] resize-none"
                        />
                        <button
                            onClick={handleSend}
                            className="btn btn-primary gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatWindow;
