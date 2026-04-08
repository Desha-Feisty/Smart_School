import { useState, useEffect } from "react";
import useAuthStore from "../stores/Authstore.js";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const navigate = useNavigate();
    const { token, role, errMsg } = useAuthStore();

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
        setErrorMsg("");
        if (!email || !password) {
            setErrorMsg("Please enter email and password");
            return;
        }
        const response = await useAuthStore.getState().login(email, password);
        console.log("Login response:", response);
        if (response.success) {
            const state = useAuthStore.getState();
            console.log("Login successful, role:", state.role, "token:", state.token?.substring(0, 20) + "...");
            if (state.role === "teacher") {
                navigate("/teacher");
            } else {
                navigate("/student");
            }
        } else {
            setErrorMsg(response.errMsg || "Login failed");
        }
    }

    const displayError = errorMsg || errMsg;

    return (
        <div className="hero bg-base-200 min-h-screen">
            <div className="hero-content flex-col lg:flex-row">
                <div className="text-center lg:text-left">
                    <h1 className="text-5xl font-bold">School</h1>
                    <p className="py-6">
                        Live as if you were to die tomorrow. Learn as if you
                        were to live forever. -<i>Ghandi</i>
                    </p>
                </div>
                <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
                    <div className="card-body">
                        {displayError && (
                            <div className="alert alert-error">
                                <span>{displayError}</span>
                            </div>
                        )}
                        <fieldset className="fieldset">
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input"
                                placeholder="Email"
                                name="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <label className="label">Password</label>
                            <input
                                type="password"
                                className="input"
                                placeholder="Password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />

                            <button
                                className="btn btn-neutral mt-4"
                                onClick={handleLogin}
                                disabled={useAuthStore.getState().isLoggingIn}
                            >
                                Login
                            </button>
                        </fieldset>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
