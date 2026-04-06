import { useState, useEffect } from "react";
import useAuthStore from "../stores/Authstore.js";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
        const response = await useAuthStore.getState().login(email, password);
        if (response.success) {
            if (useAuthStore.getState().role === "teacher") {
                navigate("/teacher");
            } else {
                navigate("/student");
            }
        } else {
            // Display error message
            console.log(response.errMsg);
            alert(response.errMsg);
        }
    }
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
