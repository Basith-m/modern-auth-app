
import { GoogleLogin } from "@react-oauth/google";

function App() {
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const response = await fetch(
                "http://localhost:5000/api/auth/google",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        credential: credentialResponse.credential,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Google login failed."
                );
            }

            console.log("Login successful:", data);
            console.log("Access token:", data.accessToken);
        } catch (error) {
            console.error("Google login error:", error.message);
        }
    };

    return (
        <main>
            <h1>Modern Auth App</h1>
            <p>Sign in to continue</p>

            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                    console.error("Google Sign-In failed.");
                }}
            />
        </main>
    );
}

export default App;