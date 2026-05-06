import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
    plugins: [tailwindcss(), react()],
    server: {
        host: "localhost",
        port: 5173,
        strictPort: true,
        hmr: {
            protocol: "ws",
            host: "localhost"
        },
        proxy: {
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
                secure: false,
                ws: true, // Enable WebSocket proxying
            },
            "/socket.io": {
                target: "http://localhost:3000",
                changeOrigin: true,
                secure: false,
                ws: true,
            }
        },
    },
});