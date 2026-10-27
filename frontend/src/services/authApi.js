
const API_URL = "http://localhost:5000/api/auth";

const request = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(
            data.message || "Something went wrong."
        );
        error.status = response.status;
        throw error;
    }

    return data;
};

// Share a single refresh request when multiple requests need renewal.
let refreshPromise = null;

export const refreshRequest = () => {
    if (!refreshPromise) {
        refreshPromise = request("/refresh", {
            method: "POST",
        }).finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
};

// Use this for protected API requests.
export const authenticatedRequest = async (
    endpoint,
    accessToken,
    setAccessToken,
    onSessionExpired,
    options = {}
) => {
    const sendRequest = (token) =>
        request(endpoint, {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${token}`,
            },
        });

    try {
        return await sendRequest(accessToken);
    } catch (error) {
        if (error.status !== 401) {
            throw error;
        }
    }

    let newAccessToken;

    try {
        const data = await refreshRequest();
        newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
    } catch (refreshError) {
        onSessionExpired();
        throw refreshError;
    }

    // Retry once. Let any retry error reach the caller.
    try {
        return await sendRequest(newAccessToken);
    } catch (error) {
        if (error.status === 401) {
            onSessionExpired();
        }
        throw error;
    }
};

export const loginRequest = (credentials) =>
    request("/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });

export const googleLoginRequest = (credential) =>
    request("/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
    });

export const registerRequest = (userData) =>
    request("/register", {
        method: "POST",
        body: JSON.stringify(userData),
    });

export const logoutRequest = () =>
    request("/logout", { method: "POST" });

export const getMeRequest = (accessToken) =>
    request("/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });