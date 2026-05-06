import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";

// Initialize theme BEFORE rendering - safe, no module-level store access
try {
    if (typeof window !== "undefined" && window.localStorage) {
        const saved = window.localStorage.getItem("theme");
        const theme = (saved === "night" || saved === "winter") ? saved : "winter";
        
        if (typeof document !== "undefined") {
            document.documentElement.setAttribute("data-theme", theme);
            if (theme === "night") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
        }
    }
} catch (e) {
    console.error("Theme pre-init error:", e);
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>,
);
