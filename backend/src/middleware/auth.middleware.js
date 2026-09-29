import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.' 
            });
        }

        const [scheme, token] = authHeader.split(' ');

        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Invalid authentication format.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        req.user = decoded; // Attach the decoded user information to the request object

        next(); // Proceed to the next middleware or route handler

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. Invalid or expired token.'
        });
    }
}

export default authMiddleware;