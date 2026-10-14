
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
        throw new Error(
            data.message || "Something went wrong."
        );
    }

    return data;
};

export const loginRequest = (credentials) => {
    return request("/login", {
        method: "POST",
        body: JSON.stringify(credentials),
    });
};

export const registerRequest = (userData) =>
    request("/register", {
        method: "POST",
        body: JSON.stringify(userData),
    });

export const googleLoginRequest = (credential) => {
    return request("/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
    });
};

export const logoutRequest = () => {
    return request("/logout", {
        method: "POST",
    });
};

export const getMeRequest = (accessToken) => {
    return request("/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
};

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