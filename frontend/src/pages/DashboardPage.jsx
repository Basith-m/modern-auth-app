
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

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

            {error && <p role="alert">{error}</p>}
        </main>
    );
}