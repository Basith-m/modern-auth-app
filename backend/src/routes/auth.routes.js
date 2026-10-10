import express from "express";
import { register, login, googleLogin, refreshAccessToken, logout, logoutAllDevices, getMe } from "../controllers/auth.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logout);
router.post("/logout-all", authMiddleware, logoutAllDevices);
router.get("/me", authMiddleware, getMe);

export default router;