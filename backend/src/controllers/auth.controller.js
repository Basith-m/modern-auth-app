import User from '../models/User.js';

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
        res.status(500).json({ 
            success: false,
            message: 'Internal server error', 
        });

        console.error('Error during user registration:', error);
    }
}