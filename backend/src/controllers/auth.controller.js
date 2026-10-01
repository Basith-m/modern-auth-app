import User from '../models/User.js';
import Session from '../models/Session.js';
import bcrypt from 'bcrypt';
import { 
    generateAccessToken, 
    generateRefreshToken, 
    verifyRefreshToken, 
    hashRefreshToken 
} from '../utils/token.js';

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

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Generate authentication tokens
        const accessToken = generateAccessToken(user._id);

        const session = new Session({
            userId: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        })
        
        //Generate refresh token using the session ID and user ID
        const refreshToken = generateRefreshToken(
            user._id,
            session._id
        );

        session.refreshTokenHash = hashRefreshToken(refreshToken);

        await session.save();

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
                new: true,
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