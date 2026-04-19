import { create } from "zustand";
import axios from "axios";
import useAuthStore from "./Authstore";

const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,
    loading: false,

    fetchNotifications: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        set({ loading: true });
        try {
            const response = await axios.get("/api/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            set({ 
                notifications: response.data.notifications, 
                unreadCount: response.data.unreadCount,
                loading: false 
            });
        } catch (error) {
            console.error("Fetch notifications error:", error);
            set({ loading: false });
        }
    },

    markAsRead: async (id) => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        try {
            await axios.patch(`/api/notifications/${id}/read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const current = get().notifications;
            const updated = current.map(n => n._id === id ? { ...n, read: true } : n);
            const newUnreadCount = Math.max(0, get().unreadCount - 1);
            
            set({ notifications: updated, unreadCount: newUnreadCount });
        } catch (error) {
            console.error("Mark read error:", error);
        }
    },

    markAllAsRead: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        try {
            await axios.post("/api/notifications/read-all", {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const updated = get().notifications.map(n => ({ ...n, read: true }));
            set({ notifications: updated, unreadCount: 0 });
        } catch (error) {
            console.error("Mark all read error:", error);
        }
    },

    // To be called when a real-time event arrives
    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications].slice(0, 20),
            unreadCount: state.unreadCount + 1
        }));
    }
}));

export default useNotificationStore;
