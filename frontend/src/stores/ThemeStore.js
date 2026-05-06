import { create } from "zustand";

// No module-level side effects - completely safe
const useThemeStore = create((set, get) => ({
    theme: "winter", // default only, no initialization here
    
    initTheme: () => {
        try {
            if (typeof window === "undefined" || !window.localStorage) return;
            
            const saved = window.localStorage.getItem("theme");
            const theme = (saved === "night" || saved === "winter") ? saved : "winter";
            
            // Save to localStorage to persist
            window.localStorage.setItem("theme", theme);
            
            if (typeof document !== "undefined") {
                document.documentElement.setAttribute("data-theme", theme);
                document.documentElement.classList.toggle("dark", theme === "night");
            }
            
            set({ theme });
            console.log("Theme initialized:", theme);
        } catch (e) {
            console.error("Theme init error:", e);
        }
    },
    
    toggleTheme: () => {
        try {
            const state = get();
            const newTheme = state.theme === "winter" ? "night" : "winter";
            
            // Save
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.setItem("theme", newTheme);
            }
            
            // Apply
            if (typeof document !== "undefined") {
                document.documentElement.setAttribute("data-theme", newTheme);
                document.documentElement.classList.toggle("dark", newTheme === "night");
            }
            
            console.log("Theme toggled to:", newTheme);
            set({ theme: newTheme });
        } catch (e) {
            console.error("Theme toggle error:", e);
        }
    },
}));

export default useThemeStore;
