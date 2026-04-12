import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./server/config/db.js";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { initializeChat } from "./server/chat.js";
import app from "./server/app.js";
const PORT = process.env.PORT || 3000;

app.use(express.json());
async function start() {
    try {
        await connectDB();
        const server = http.createServer(app);
        const io = new SocketIOServer(server, {
            cors: {
                origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
                methods: ["GET", "POST"],
                credentials: true,
            },
        });
        initializeChat(io);

        server.listen(PORT, () => {
            console.log(`API server listening on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

start();
