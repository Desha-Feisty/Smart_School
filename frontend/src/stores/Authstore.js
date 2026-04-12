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
                set({ isLoggingIn: true, errMsg: null });
                try {
                    const response = await axios.post("/api/auth/login", {
                        email,
                        password,
                    });
                    console.log("Login response:", response.data);
                    if (!response.data.success) {
                        set({
                            isLoggingIn: false,
                            errMsg: response.data.errMsg,
                        });
                        return response.data;
                    }
                    const loginUser = {
                        ...response.data.user,
                        id:
                            response.data.user.id ||
                            response.data.user._id?.toString(),
                    };
                    set({ user: loginUser });
                    set({ token: response.data.token });
                    set({ role: loginUser.role });
                    set({ isLoggingIn: false });
                    set({ errMsg: null });
                    return response.data;
                } catch (error) {
                    const errMsg =
                        error.response?.data?.errMsg ||
                        error.message ||
                        "Login failed";
                    console.error("Login error:", errMsg);
                    set({ isLoggingIn: false, errMsg });
                    return { success: false, errMsg };
                }
            },
            register: async (name, email, password, role) => {
                set({ errMsg: null });
                try {
                    const response = await axios.post("/api/auth/register", {
                        name,
                        email,
                        password,
                        role,
                    });
                    console.log("Register response:", response.data);
                    if (!response.data.success) {
                        set({ errMsg: response.data.errMsg });
                        return response.data;
                    }
                    const registerUser = {
                        ...response.data.user,
                        id:
                            response.data.user.id ||
                            response.data.user._id?.toString(),
                    };
                    set({ user: registerUser });
                    set({ token: response.data.token });
                    set({ role: registerUser.role });
                    set({ errMsg: null });
                    return response.data;
                } catch (error) {
                    const errMsg =
                        error.response?.data?.errMsg ||
                        error.message ||
                        "Registration failed";
                    console.error("Register error:", errMsg);
                    set({ errMsg });
                    return { success: false, errMsg };
                }
            },
            logout: () => {
                set({
                    user: null,
                    token: null,
                    role: null,
                    errMsg: null,
                    isLoggingIn: false,
                });
            },
        }),
        {
            name: "auth-storage", // name of the item in the storage (must be unique)
        },
    ),
);

// Interceptor to handle token expiry (401 errors)
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            (error.response?.data?.details === "jwt expired" ||
                error.response?.data?.errMsg === "unable to verify user")
        ) {
            console.log("Token expired, logging out...");
            // Clear the Authstore by accessing the state directly
            useAuthStore.getState().logout();
            // Redirect to login page if window is available
            if (
                typeof window !== "undefined" &&
                !window.location.pathname.includes("/login")
            ) {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    },
);

export default useAuthStore;
