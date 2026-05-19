import { useState, useEffect } from "react";
import { Wifi, WifiOff, AlertTriangle, Loader2 } from "lucide-react";
import { checkBackendHealth, getBackendStatus, demoData } from "../../lib/api";
import useAuthStore from "../../stores/Authstore";

export default function ConnectionStatus() {
    const [status, setStatus] = useState("checking"); // checking | available | unavailable
    const [showDemoBanner, setShowDemoBanner] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const setUser = useAuthStore((state) => state.setUser);
    const setToken = useAuthStore((state) => state.setToken);
    const setRole = useAuthStore((state) => state.setRole);

    useEffect(() => {
        // Check backend on mount
        const checkStatus = async () => {
            const isAvailable = await checkBackendHealth();
            setStatus(isAvailable ? "available" : "unavailable");
            
            // Show demo banner if backend not available
            if (!isAvailable) {
                setShowDemoBanner(true);
            }
        };
        
        // Only check in browser environment
        if (typeof window !== "undefined") {
            checkStatus();
        }
    }, []);

    const enableDemoMode = () => {
        // Set demo user data
        setUser(demoData.user);
        setToken("demo-token");
        setRole(demoData.user.role);
        setIsDemoMode(true);
        setShowDemoBanner(false);
        
        // Store in localStorage to persist
        localStorage.setItem("demo-mode", "true");
        localStorage.setItem("auth-storage", JSON.stringify({
            state: {
                user: demoData.user,
                token: "demo-token",
                role: demoData.user.role,
            }
        }));
        
        console.log("🎮 [ConnectionStatus] Demo mode enabled");
    };

    const dismissBanner = () => {
        setShowDemoBanner(false);
    };

    // Don't show anything if backend is available
    if (status === "available" && !isDemoMode) {
        return null;
    }

    // Show demo mode banner
    if (showDemoBanner) {
        return (
            <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">
                    Backend unavailable. Running in offline mode.
                </span>
                <button
                    onClick={enableDemoMode}
                    className="btn btn-sm bg-amber-600 text-white hover:bg-amber-700 border-none"
                >
                    Try Demo Mode
                </button>
                <button
                    onClick={dismissBanner}
                    className="btn btn-sm btn-ghost btn-circle text-amber-900"
                >
                    ✕
                </button>
            </div>
        );
    }

    // Show demo mode indicator
    if (isDemoMode) {
        return (
            <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Demo Mode</span>
                <button
                    onClick={() => {
                        setIsDemoMode(false);
                        localStorage.removeItem("demo-mode");
                        localStorage.removeItem("auth-storage");
                        window.location.reload();
                    }}
                    className="btn btn-xs btn-circle btn-ghost"
                >
                    ✕
                </button>
            </div>
        );
    }

    return null;
}