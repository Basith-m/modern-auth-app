import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateAccessToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
    )
}

export const generateRefreshToken = (userId, sessionId) => {
    return jwt.sign(
        { 
            userId, 
            sessionId 
        },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    )
}

export const verifyRefreshToken = (token) => {
    return jwt.verify(
        token, 
        process.env.JWT_REFRESH_SECRET
    );
}

export const hashRefreshToken = (token) => {
    return crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
}