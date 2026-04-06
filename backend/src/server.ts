import dotenv from "dotenv";
dotenv.config();
import express from "express";
import connectDB from "./server/config/db.js";
import http from "http";
import app from "./server/app.js";
const PORT = process.env.PORT || 3000;

app.use(express.json());
async function start() {
    try {
        await connectDB();
        const server = http.createServer(app);
        server.listen(PORT, () => {
            console.log(`API server listening on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

start();
