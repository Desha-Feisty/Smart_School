import { Loader2 } from "lucide-react";

export function LoadingSpinner({ size = "md", className = "" }) {
    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16",
    };

    return (
        <Loader2
            className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`}
        />
    );
}

export function LoadingOverlay({ message = "Loading..." }) {
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-panel p-8 flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-slate-600 dark:text-slate-300 font-medium">
                    {message}
                </p>
            </div>
        </div>
    );
}

export function LoadingPage({ message = "Loading..." }) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="xl" />
                <p className="text-slate-500 dark:text-slate-400">{message}</p>
            </div>
        </div>
    );
}

export function LoadingButton({ loading, children, className = "", ...props }) {
    return (
        <button
            className={`btn btn-primary ${loading ? "loading" : ""} ${className}`}
            disabled={loading}
            {...props}
        >
            {loading && <span className="loading loading-spinner loading-sm" />}
            {children}
        </button>
    );
}