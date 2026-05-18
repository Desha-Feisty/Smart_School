import { create } from "zustand";

const useChatStore = create((set) => ({
    activeChat: null,
    openChat: (peerId, peerName, courseId) => {
        set({ activeChat: { peerId, peerName, courseId } });
    },
    closeChat: () => {
        set({ activeChat: null });
    },
}));

export default useChatStore;