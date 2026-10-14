
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const location = useLocation();
    const successMessage = location.state?.message;

    const handleLogin = async (event) => {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await login(email, password);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleLogin = async (response) => {
        setError("");
        setSubmitting(true);

        try {
            await googleLogin(response.credential);
            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main>
            <h1>Welcome back</h1>
            
            {successMessage && <p role="status">{successMessage}</p>}

            <p>Sign in to your account</p>

            <form onSubmit={handleLogin}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={submitting}>
                    {submitting ? "Signing in..." : "Sign in"}
                </button>
            </form>

            <p>Or continue with Google</p>

            <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => setError("Google sign-in failed.")}
            />

            {error && <p role="alert">{error}</p>}

            <p>
                Don't have an account? <Link to="/register">Register</Link>
            </p>
        </main>
    );
}