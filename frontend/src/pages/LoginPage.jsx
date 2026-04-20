import { useState, useEffect } from "react";
import useAuthStore from "../stores/Authstore.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BookOpen, LogIn, Mail, Lock } from "lucide-react";
import PageWrapper from "../components/layout/PageWrapper";
import useThemeStore from "../stores/ThemeStore";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { token, role } = useAuthStore();
    
    // Initialize theme store here just so it's loaded early if not in App
    useThemeStore(); 

    useEffect(() => {
        if (token) {
            if (role === "teacher") {
                navigate("/teacher");
            } else if (role === "admin") {
                navigate("/admin");
            } else {
                navigate("/student");
            }
        }
    }, [token, role, navigate]);

    async function handleLogin() {
        if (!email || !password) {
            toast.error("Please enter email and password");
            return;
        }

        setLoading(true);
        try {
            const response = await useAuthStore
                .getState()
                .login(email, password);
            if (response.success) {
                const state = useAuthStore.getState();
                toast.success("Login successful!", { duration: 2000 });
                setTimeout(() => {
                    if (state.role === "teacher") {
                        navigate("/teacher");
                    } else if (state.role === "admin") {
                        navigate("/admin");
                    } else {
                        navigate("/student");
                    }
                }, 500);
            } else {
                toast.error(response.errMsg || "Login failed");
            }
        } finally {
            setLoading(false);
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    };

    return (
        <PageWrapper>
            <div className="min-h-screen flex items-center justify-center p-6 relative">
                {/* Decorative blobs */}
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
                <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

                <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 lg:gap-20 items-center z-10">
                    {/* Left Side - Welcome & Branding */}
                    <div className="text-center lg:text-left space-y-8">
                        <div className="join gap-4 items-center justify-center lg:justify-start inline-flex">
                            <div className="bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl p-4 shadow-lg shadow-blue-500/30">
                                <BookOpen className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                                Learn<span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">Hub</span>
                            </h1>
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                                Unlock your potential
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto lg:mx-0">
                                "Live as if you were to die tomorrow. Learn as if you were to live forever."
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                            <div>
                                <div className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">100+</div>
                                <div className="text-sm text-slate-500 font-medium">Courses</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">5K+</div>
                                <div className="text-sm text-slate-500 font-medium">Students</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">50+</div>
                                <div className="text-sm text-slate-500 font-medium">Teachers</div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login form */}
                    <div className="w-full max-w-md mx-auto lg:mx-0">
                        <div className="glass-panel rounded-3xl p-8 sm:p-10 relative overflow-hidden">
                            {/* Subtle highlight */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-blue-500 to-purple-500"></div>

                            <div className="mb-8 pl-1">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Please enter your details to sign in.</p>
                            </div>

                            <div className="space-y-5">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium text-slate-700 dark:text-slate-300">Email</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="input input-lg w-full pl-12 bg-slate-50/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-xl"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text font-medium text-slate-700 dark:text-slate-300">Password</span>
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                            <Lock className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="input input-lg w-full pl-12 bg-slate-50/50 dark:bg-base-300/50 border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all rounded-xl"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button
                                    className={`btn btn-primary btn-lg w-full rounded-xl mt-6 font-semibold shadow-lg shadow-blue-500/30 ${loading ? "loading" : ""}`}
                                    onClick={handleLogin}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Signing In...
                                        </>
                                    ) : (
                                        <>
                                            <LogIn className="w-5 h-5 mr-2" />
                                            Sign In
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Demo Credentials</p>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-slate-100 dark:bg-base-300/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <p className="font-semibold text-slate-700 dark:text-slate-300">Teacher</p>
                                        <p className="text-slate-500 dark:text-slate-500 mt-1 truncate">teacher@test.com</p>
                                    </div>
                                    <div className="bg-slate-100 dark:bg-base-300/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <p className="font-semibold text-slate-700 dark:text-slate-300">Student</p>
                                        <p className="text-slate-500 dark:text-slate-500 mt-1 truncate">student@test.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <p className="text-center text-xs text-slate-500 font-medium mt-6">
                            🔒 Protected by end-to-end encryption
                        </p>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
}

export default LoginPage;
