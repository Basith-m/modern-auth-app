import User from '../models/User.js';
import Session from '../models/Session.js';
import bcrypt from 'bcrypt';
import { 
    generateAccessToken, 
    generateRefreshToken, 
    verifyRefreshToken, 
    hashRefreshToken 
} from '../utils/token.js';
import { verifyGoogleIdToken } from "../services/google.service.js";
import { createAuthSession } from "../services/auth.service.js";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Name, email, and password are required', 
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ 
                success: false,
                message: 'Email is already registered', 
            });
        }

        const user = await User.create({ name, email, password });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
        });

    } catch (error) {
        console.error('Error during user registration:', error);

        res.status(500).json({ 
            success: false,
            message: 'Internal server error', 
        });       
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Check whether this account supports password login
        if (user.provider === "google" || !user.password) {
            return res.status(401).json({
                message:
                    "This account uses Google sign-in. Please continue with Google.",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        const { accessToken, refreshToken } = await createAuthSession(user._id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
            sameSite: 'Strict', // Prevent CSRF attacks
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error('Error during user login:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}

export const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required.",
            });
        }

        // 1. Verify the Google ID token
        let payload;

        try {
            payload = await verifyGoogleIdToken(credential);
        } catch {
            return res.status(401).json({
                success: false,
                message: "Invalid Google credential.",
            });
        }

        const {
            sub: googleId,
            email,
            email_verified: emailVerified,
            name,
            picture,
        } = payload;

        // 2. Validate the required Google information
        if (!googleId || !email || !emailVerified) {
            return res.status(401).json({
                success: false,
                message: "A verified Google email is required.",
            });
        }

        // 3. Find an existing Google account
        let user = await User.findOne({
            provider: "google",
            providerId: googleId,
        });

        if (!user) {
            // 4. Prevent silently merging an existing local account
            const existingUser = await User.findOne({
                email: email.toLowerCase(),
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message:
                        "An account already exists with this email. Please log in using your existing method.",
                });
            }

            // 5. Create a new Google user
            user = await User.create({
                name: name || "Google User",
                email: email.toLowerCase(),
                provider: "google",
                providerId: googleId,
                avatar: picture || null,
                isEmailVerified: true,
            });
        }

        // 6. Create our own application session
        const { accessToken, refreshToken } =
            await createAuthSession(user._id);

        // 7. Set our own refresh token cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // 8. Return our access token and user information
        return res.status(200).json({
            success: true,
            message: "Google login successful.",
            accessToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        // Handle a concurrent registration for the same email
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account already exists with this email.",
            });
        }

        console.error("Google login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error.",
        });
    }
};

export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required',
            });
        }

        const decoded = verifyRefreshToken(refreshToken);

        const { userId, sessionId } = decoded;

         // Hash the token received from the client
        const currentTokenHash = hashRefreshToken(refreshToken);

        const newAccessToken = generateAccessToken(userId);

        // Rotate refresh token
        const newRefreshToken = generateRefreshToken(
            userId,
            sessionId
        );

        const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Atomically replace the old refresh-token hash
        const updatedSession = await Session.findOneAndUpdate(
            {
                _id: sessionId,
                userId,
                refreshTokenHash: currentTokenHash,
                revokedAt: null,
                expiresAt: { $gt: new Date() },
            },
            {
                $set: {
                    refreshTokenHash: newRefreshTokenHash,
                    expiresAt: newExpiresAt,
                },
            },
            {
                returnDocument: "after",
            }
        );

        // The token could not be consumed
        if (!updatedSession) {
            // Check whether this was a possible token-reuse attempt
            const existingSession = await Session.findOne({
                _id: sessionId,
                userId,
            });

            if (
                existingSession &&
                !existingSession.revokedAt
            ) {
                existingSession.revokedAt = new Date();
                await existingSession.save();
            }

            return res.status(401).json({
                success: false,
                message: "Invalid refresh token.",
            });
        }   

        // Send the new refresh token as HttpOnly cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
        });

    } catch (error) {
        console.error('Error refreshing access token:', error);

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
        });
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (refreshToken) {
            try {
                const decoded = verifyRefreshToken(refreshToken);

                await Session.findOneAndUpdate(
                    {
                        _id: decoded.sessionId,
                        userId: decoded.userId,
                        revokedAt: null,
                    },
                    {
                        revokedAt: new Date(),
                    }
                );
            } catch (error) {
                // Token is already invalid or expired.
                // We still continue with logout.
            }
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        });

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
    
}

export const logoutAllDevices = async (req, res) => {
    try {
        await Session.updateMany(
            {
                userId: req.user.userId,
                revokedAt: null,
            },
            {
                $set: {
                    revokedAt: new Date(),
                },
            }
        );

        // Clear the current device's refresh token
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out from all devices successfully.",
        });

    } catch (error) {
        console.error("Error logging out from all devices:", error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            }
        });

    } catch (error) {
        console.error('Error fetching user data:', error);

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
}