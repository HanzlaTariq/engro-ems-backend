import express from "express";
import {
  createWeeklySpotCheck,
  getWeeklySpotCheck,
  getMyWeeklySpotCheck,
  getWeeklySpotCheckById,
  updateWeeklySpotCheck,
  verifyWeeklyspotcheck,
  deleteWeekySpotCheck
} from "../controllers/weeklySpotCheckController.js";
import auth from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";


import { validateObjectIdParam } from "../middleware/security.js";

const router = express.Router();
router.param("id", validateObjectIdParam); // invalid id -> 400 (500 nahi)

router.post("/", auth, createWeeklySpotCheck);
router.get("/my", auth, getMyWeeklySpotCheck);  // User apne
router.get("/", auth, verifyAdmin, getWeeklySpotCheck);  // Admin saare (filtered)

router.get("/:id", auth, getWeeklySpotCheckById); // Fetch one (owner) — used for edit prefill
router.put("/:id", auth, updateWeeklySpotCheck); // User edit (blocked once verified)

router.put("/verify/:id", auth,verifyAdmin, verifyWeeklyspotcheck); // Admin verify
router.delete("/:id", auth, deleteWeekySpotCheck);

export default router;