import { create } from "zustand";
import { io } from "socket.io-client";

const useSocketStore = create((set) => {
    let socket = null;

    const backendUrl =
        import.meta.env.VITE_BACKEND_URL ||
        (window.location.hostname === "localhost"
            ? "http://localhost:3000"
            : window.location.origin);

    return {
        isConnected: false,
        socket: null,

        connect: (token) => {
            if (socket?.connected) return;

            socket = io(backendUrl, {
                auth: { token },
                transports: ["websocket"],
            });

            socket.on("connect", () => {
                set({ isConnected: true, socket });
                console.log("Global socket connected");
            });

            socket.on("disconnect", () => {
                set({ isConnected: false });
                console.log("Global socket disconnected");
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
