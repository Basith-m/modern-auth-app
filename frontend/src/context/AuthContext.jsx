
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    loginRequest,
    googleLoginRequest,
    logoutRequest,
    getMeRequest,
    refreshRequest,
    authenticatedRequest,
} from "../services/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Email/password login
    const login = async (email, password) => {
        const data = await loginRequest({ email, password });

        setUser(data.user);
        setAccessToken(data.accessToken);

        return data;
    };

    // Google login
    const googleLogin = async (credential) => {
        const data = await googleLoginRequest(credential);

        setUser(data.user);
        setAccessToken(data.accessToken);

        return data;
    };

    // Logout from the current session
    const logout = async () => {
        try {
            await logoutRequest();
        } finally {
            setUser(null);
            setAccessToken(null);
        }
    };

    const requestWithAuth = async (endpoint, options = {}) => {
        return authenticatedRequest(
            endpoint,
            accessToken,
            setAccessToken,
            () => {
                setUser(null);
                setAccessToken(null);
            },
            options
        );
    };

    // Restore a session after a page reload
    const restoreSession = useCallback(async () => {
        try {
            const data = await refreshRequest();
            const newAccessToken = data.accessToken;

            const profile = await getMeRequest(newAccessToken);

            setAccessToken(newAccessToken);
            setUser(profile.user);
        } catch (error) {
            console.error("Session restoration failed:", error);
            
            setUser(null);
            setAccessToken(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        restoreSession();
    }, [restoreSession]);

    const value = {
        user,
        accessToken,
        isAuthenticated: Boolean(user && accessToken),
        loading,
        login,
        googleLogin,
        logout,
        requestWithAuth,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for consuming authentication state
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth must be used within an AuthProvider."
        );
    }

    return context;
};