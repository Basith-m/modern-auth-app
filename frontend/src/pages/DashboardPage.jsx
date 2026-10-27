
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
    const { user, logout, requestWithAuth } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [apiMessage, setApiMessage] = useState("");

    const handleLogout = async () => {
        setError("");
        setSubmitting(true);

        try {
            await logout();
            navigate("/login", { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const testProtectedRequest = async () => {
        setApiMessage("");

        try {
            const data = await requestWithAuth("/me");
            setApiMessage(`Protected request succeeded: ${data.user.email}`);
        } catch (error) {
            setApiMessage(`Request failed: ${error.message}`);
        }
    };

    return (
        <main>
            <h1>Dashboard</h1>
            <p>Welcome, {user?.name}!</p>
            <p>Email: {user?.email}</p>

            {user?.avatar && (
                <img src={user.avatar} alt="Profile" width="80" />
            )}

            <p>You are authenticated.</p>

            <button onClick={handleLogout} disabled={submitting}>
                {submitting ? "Signing out..." : "Logout"}
            </button>

            <br></br>
            {error && <p role="alert">{error}</p>}

            <button onClick={testProtectedRequest}>
                Test Protected API
            </button>

            <p>{apiMessage}</p>
        </main>
    );
}