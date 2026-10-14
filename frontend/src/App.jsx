
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";

function AppRoutes() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <main><p>Restoring your session...</p></main>;
    }

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <Navigate
                        to={isAuthenticated ? "/dashboard" : "/login"}
                        replace
                    />
                }
            />

            <Route
                path="/login"
                element={
                    isAuthenticated
                        ? <Navigate to="/dashboard" replace />
                        : <LoginPage />
                }
            />

            <Route
                path="/register"
                element={
                    isAuthenticated
                        ? <Navigate to="/dashboard" replace />
                        : <RegisterPage />
                }
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    );
}