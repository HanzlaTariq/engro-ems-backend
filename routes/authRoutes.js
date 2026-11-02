// routes/authRoutes.js
import express from "express";
import { login } from "../controllers/authController.js";

const router = express.Router();

// Login route (rate limit + account lockout laga hua hai)
// NOTE: Public /register route hata diya gaya hai (security risk tha).
router.post("/login", login);

export default router;
