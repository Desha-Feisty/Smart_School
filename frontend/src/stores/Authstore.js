import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            setUser: (user) => set({ user }),
            clearUser: () => set({ user: null }),
            role: null,
            setRole: (role) => set({ role }),
            clearRole: () => set({ role: null }),
            token: null,
            setToken: (token) => set({ token }),
            clearToken: () => set({ token: null }),
            isLoggingIn: false,
            setIsLoggingIn: (isLoggingIn) => set({ isLoggingIn }),
            errMsg: null,
            setErrMsg: (errMsg) => set({ errMsg }),
            clearErrMsg: () => set({ errMsg: null }),
            login: async (email, password) => {
                set({ isLoggingIn: true });
                const response = await axios.post("/api/auth/login", {
                    email,
                    password,
                });
                if (!response.data.success) return response.data;
                set({ user: response.data.user });
                set({ token: response.data.token });
                set({ role: response.data.user.role });
                set({ isLoggingIn: false });
                set({ errMsg: null });
                return response.data;
            },
            register: async (name, email, password, role) => {
                const response = await axios.post("/api/auth/register", {
                    name,
                    email,
                    password,
                    role,
                });
                if (!response.data.success) return response.data;
                set({ user: response.data.user });
                set({ token: response.data.token });
                set({ role: response.data.user.role });
                return response.data;
            },
            logout: () => {
                set({ user: null, token: null, role: null });
            },
        }),
        {
            name: "auth-storage", // name of the item in the storage (must be unique)
        },
    ),
);

export default useAuthStore;
