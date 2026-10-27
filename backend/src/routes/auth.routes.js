import express from "express";
import { register, login, googleLogin, refreshAccessToken, logout, logoutAllDevices, getMe } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import {
    registerSchema,
    loginSchema,
} from "../validators/auth.validator.js";
import { loginLimiter } from "../middleware/authLimiter.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/google", googleLogin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAllDevices);
router.get("/me", authMiddleware, getMe);

export default router;