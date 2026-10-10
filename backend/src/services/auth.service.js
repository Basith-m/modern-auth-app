import Session from "../models/Session.js";
import {
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken,
} from "../utils/token.js";

export const createAuthSession = async (userId) => {
    // Generate authentication tokens
    const accessToken = generateAccessToken(userId);

    const session = new Session({
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    })
        
    //Generate refresh token using the session ID and user ID
    const refreshToken = generateRefreshToken(
        userId,
        session._id
    );

    session.refreshTokenHash = hashRefreshToken(refreshToken);

    await session.save()

    return { accessToken, refreshToken };
};