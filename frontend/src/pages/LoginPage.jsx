import { useState, useEffect } from "react";
import useAuthStore from "../stores/Authstore.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BookOpen, LogIn, Mail, Lock } from "lucide-react";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { token, role } = useAuthStore();

    useEffect(() => {
        if (token) {
            if (role === "teacher") {
                navigate("/teacher");
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
                toast.success("Login successful!");
                setTimeout(() => {
                    if (state.role === "teacher") {
                        navigate("/teacher");
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
        <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
            <div className="hero min-h-screen">
                <div className="hero-content flex-col lg:flex-row-reverse gap-12">
                    {/* Right Side - Branding */}
                    <div className="lg:w-1/2 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                            <div className="p-3 bg-linear-to-br from-blue-600 to-purple-600 rounded-lg">
                                <BookOpen className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                LearnHub
                            </h1>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Welcome Back
                        </h2>
                        <p className="text-lg text-gray-600 mb-6">
                            "Live as if you were to die tomorrow. Learn as if
                            you were to live forever."
                        </p>
                        <p className="text-sm text-gray-500 italic">
                            — Mahatma Gandhi
                        </p>

                        <div className="mt-8 grid grid-cols-3 gap-4 lg:flex lg:gap-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    100+
                                </div>
                                <div className="text-sm text-gray-600">
                                    Courses
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    5K+
                                </div>
                                <div className="text-sm text-gray-600">
                                    Students
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pink-600">
                                    50+
                                </div>
                                <div className="text-sm text-gray-600">
                                    Teachers
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left Side - Login Form */}
                    <div className="lg:w-1/2 w-full max-w-sm">
                        <div className="card bg-white shadow-2xl border border-gray-100">
                            <div className="card-body p-8">
                                <h3 className="card-title text-2xl mb-6 text-gray-900">
                                    Sign In
                                </h3>

                                {/* Email Input */}
                                <div className="form-control mb-5">
                                    <label className="label">
                                        <span className="label-text font-semibold text-gray-700">
                                            Email Address
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            className="input input-bordered w-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={email}
                                            onChange={(e) =>
                                                setEmail(e.target.value)
                                            }
                                            onKeyPress={handleKeyPress}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="form-control mb-6">
                                    <label className="label">
                                        <span className="label-text font-semibold text-gray-700">
                                            Password
                                        </span>
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="input input-bordered w-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            onKeyPress={handleKeyPress}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {/* Login Button */}
                                <button
                                    className={`btn btn-primary w-full gap-2 ${loading ? "loading" : ""}`}
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
                                            <LogIn className="w-5 h-5" />
                                            Sign In
                                        </>
                                    )}
                                </button>

                                {/* Demo Credentials */}
                                <div className="divider my-6">
                                    Demo Credentials
                                </div>
                                <div className="space-y-2 text-sm bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <p>
                                        <strong>Teacher:</strong>{" "}
                                        teacher@test.com / password
                                    </p>
                                    <p>
                                        <strong>Student:</strong>{" "}
                                        student@test.com / password
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <p className="text-center text-sm text-gray-600 mt-6">
                            Protected by end-to-end encryption
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
