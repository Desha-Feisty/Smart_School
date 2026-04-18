import { create } from "zustand";

const useThemeStore = create((set) => {
    // Check local storage or system preference
    const storedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = storedTheme || (systemPrefersDark ? "night" : "winter");

    // Apply initially
    if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", initialTheme);
        if (initialTheme === "night") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }

    return {
        theme: initialTheme,
        toggleTheme: () => set((state) => {
            const newTheme = state.theme === "winter" ? "night" : "winter";
            localStorage.setItem("theme", newTheme);
            document.documentElement.setAttribute("data-theme", newTheme);
            if (newTheme === "night") {
                document.documentElement.classList.add("dark");
            } else {
                document.documentElement.classList.remove("dark");
            }
            return { theme: newTheme };
        }),
    };
});

export default useThemeStore;
