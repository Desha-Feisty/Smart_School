import { create } from "zustand";
import { io } from "socket.io-client";

const useSocketStore = create((set) => {
    let socket = null;

    const backendUrl = "http://localhost:3000";

    return {
        isConnected: false,
        socket: null,

        connect: (token) => {
            if (socket?.connected) return;

            socket = io({
                auth: { token },
                transports: ["websocket", "polling"],
                forceNew: true,
                reconnection: true,
            });

            socket.on("connect", () => {
                set({ isConnected: true, socket });
            });

            socket.on("disconnect", () => {
                set({ isConnected: false });
            });

            socket.on("socket-error", ({ message }) => {
                console.error("Socket error:", message);
            });
        },

        disconnect: () => {
            if (socket) {
                socket.disconnect();
                socket = null;
                set({ isConnected: false, socket: null });
            }
        },

        emit: (event, data) => {
            if (socket?.connected) {
                socket.emit(event, data);
            }
        },

        on: (event, callback) => {
            if (socket) {
                socket.on(event, callback);
            }
        },

        off: (event, callback) => {
            if (socket) {
                socket.off(event, callback);
            }
        }
    };
});

export default useSocketStore;
