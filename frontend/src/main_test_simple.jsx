import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

// Super simple test - no stores, no theme
function TestApp() {
    return (
        <div style={{ padding: "20px", backgroundColor: "#f0f0f0" }}>
            <h1 style={{ color: "red" }}>TEST - If you see this, React is working!</h1>
            <p>Current time: {new Date().toLocaleTimeString()}</p>
            <button onClick={() => alert("Click works!")}>Test Button</button>
        </div>
    );
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <BrowserRouter>
            <TestApp />
        </BrowserRouter>
    </StrictMode>,
);
