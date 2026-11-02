import express from "express";
import { loginAdmin, addAdmin } from "../controllers/adminController.js";
import auth from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin login (no token required, rate-limited + lockout)
router.post("/login", loginAdmin);

// Sirf logged-in ADMIN naya admin bana sakta hai
router.post("/add-admin", auth, requireRole("admin"), addAdmin);

// NOTE:
// - /create-first-admin hata diya (koi bhi bina login ke admin bana sakta tha).
//   Pehla admin ab `node scripts/createAdmin.js` se banega.
// - /add-incharge aur /warehouses (DO) purane aur toot-e hue the, hata diye.

export default router;
