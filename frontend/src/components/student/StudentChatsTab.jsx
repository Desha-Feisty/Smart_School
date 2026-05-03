import { useEffect, useState } from "react";
import axios from "axios";
import { MessageSquare, Loader } from "lucide-react";
import useAuthStore from "../../stores/Authstore";
import ChatConversationItem from "../ChatConversationItem";
import ChatPanel from "../ChatPanel";
import toast from "react-hot-toast";

function StudentChatsTab({ allCourses }) {
    const { token } = useAuthStore();
    const [conversations, setConversations] = useState([]);
    const [openChats, setOpenChats] = useState([]); // { courseId, peerId, peerName, courseName }
    const [selectedChatId, setSelectedChatId] = useState(null); // "courseId_peerId"
    const [loading, setLoading] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({}); // { "courseId_peerId": count }

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const response = await axios.get("/api/chats/v2/recent", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = response.data;

            // Transform backend data to conversation objects
            const conversationList = Object.entries(data)
                .map(([key, convData]) => {
                    const { messages, peer, course, peerId, courseId } =
                        convData;
                    if (!messages || messages.length === 0) return null;

                    // The backend already sorts by -createdAt, so messages[0] is the latest
                    const lastMsg = messages[0];

                    const peerName = peer?.name || "Unknown";
                    const courseName = course?.title || "Unknown Course";

                    const lastText = lastMsg.text || "No message text";
                    const lastTime =
                        lastMsg.createdAt || new Date().toISOString();

                    return {
                        id: key,
                        courseId,
                        peerId,
                        peerName,
                        courseName,
                        lastMessage: lastText,
                        lastMessageTime: lastTime,
                        messages,
                    };
                })
                .filter(Boolean);

            // Sort by most recent message
            conversationList.sort(
                (a, b) =>
                    new Date(b.lastMessageTime) - new Date(a.lastMessageTime),
            );

            setConversations(conversationList);

            // Auto-select first conversation if none selected
            if (conversationList.length > 0 && !selectedChatId) {
                setSelectedChatId(conversationList[0].id);
                openChat(conversationList[0]);
            }
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
            toast.error("Failed to load conversations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token && allCourses.length > 0) {
            fetchConversations();
        }
    }, [token, allCourses]);

    const updateConversationPreview = (conversationId, message) => {
        setConversations((prev) => {
            const updated = prev.map((conv) => {
                if (conv.id !== conversationId) return conv;
                return {
                    ...conv,
                    lastMessage:
                        message.text || conv.lastMessage || "No message text",
                    lastMessageTime:
                        message.createdAt || new Date().toISOString(),
                    messages: [...conv.messages, message],
                };
            });

            updated.sort(
                (a, b) =>
                    new Date(b.lastMessageTime) - new Date(a.lastMessageTime),
            );

            return updated;
        });
    };

    const openChat = (conversation) => {
        const chatId = conversation.id;

        setSelectedChatId(chatId);
        // Clear unread for this conversation
        setUnreadCounts((prev) => ({
            ...prev,
            [chatId]: 0,
        }));

        setOpenChats((prev) => {
            if (
                prev.some(
                    (c) =>
                        c.courseId === conversation.courseId &&
                        c.peerId === conversation.peerId,
                )
            ) {
                return prev;
            }

            return [
                ...prev,
                {
                    courseId: conversation.courseId,
                    peerId: conversation.peerId,
                    peerName: conversation.peerName,
                    courseName: conversation.courseName,
                },
            ];
        });
    };

    const closeChat = (courseId, peerId) => {
        const chatId = `${courseId}_${peerId}`;
        setOpenChats((prev) =>
            prev.filter(
                (c) => !(c.courseId === courseId && c.peerId === peerId),
            ),
        );

        // If closed chat was selected, select another or clear
        if (selectedChatId === chatId) {
            const remaining = openChats.filter(
                (c) => !(c.courseId === courseId && c.peerId === peerId),
            );
            setSelectedChatId(
                remaining.length > 0
                    ? `${remaining[0].courseId}_${remaining[0].peerId}`
                    : null,
            );
        }
    };

    const selectedChat = openChats.find(
        (c) => selectedChatId === `${c.courseId}_${c.peerId}`,
    );

    return (
        <div className="animate-in fade-in duration-500">
            {/* Container for list + chat */}
            <div
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden"
                style={{ height: "calc(100vh - 250px)" }}
            >
                {/* Conversations List - Left Sidebar */}
                <div className="lg:col-span-1 glass-panel rounded-2xl overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                            My Chats
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {conversations.length} conversation
                            {conversations.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* Conversations List */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader className="w-6 h-6 animate-spin text-blue-500" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No conversations yet</p>
                                <p className="text-xs mt-2">
                                    Start a chat from your course cards
                                </p>
                            </div>
                        ) : (
                            conversations.map((conversation) => (
                                <ChatConversationItem
                                    key={conversation.id}
                                    conversation={{
                                        ...conversation,
                                        unreadCount:
                                            unreadCounts[conversation.id] || 0,
                                    }}
                                    isSelected={
                                        selectedChatId === conversation.id
                                    }
                                    onSelect={() => openChat(conversation)}
                                    onRemove={() =>
                                        closeChat(
                                            conversation.courseId,
                                            conversation.peerId,
                                        )
                                    }
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Active Chat - Right Panel */}
                <div className="lg:col-span-2 flex flex-col overflow-hidden">
                    {selectedChat && selectedChatId ? (
                        <ChatPanel
                            key={selectedChatId}
                            courseId={selectedChat.courseId}
                            peerId={selectedChat.peerId}
                            peerName={selectedChat.peerName}
                            courseName={selectedChat.courseName}
                            onNewMessage={(message) =>
                                updateConversationPreview(
                                    selectedChatId,
                                    message,
                                )
                            }
                        />
                    ) : (
                        <div className="glass-panel rounded-2xl flex flex-col items-center justify-center flex-1">
                            <MessageSquare className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-lg font-medium text-slate-600 dark:text-slate-400">
                                Select a conversation to start chatting
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">
                                Or start a new chat from your course cards
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Hidden note about dual-path initiation */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                💡 Tip: You can also start chats directly from your course cards
            </p>
        </div>
    );
}

export default StudentChatsTab;
