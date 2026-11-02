import express from "express";
import {
  createQuarterlySpotCheck,
  getQuarterlySpotCheck,
  getMyQuarterlySpotCheck,
  getQuarterlySpotCheckById,
  updateQuarterlySpotCheck,
  deleteQuarterlySpotCheck,
  verifyQuarterlyspotcheck
} from "../controllers/QuarterlySpotCheckController.js";
import auth from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";


import { validateObjectIdParam } from "../middleware/security.js";

const router = express.Router();
router.param("id", validateObjectIdParam); // invalid id -> 400 (500 nahi)

router.post("/", auth, createQuarterlySpotCheck);
router.get("/my", auth, getMyQuarterlySpotCheck);  // User apne
router.get("/", auth, verifyAdmin, getQuarterlySpotCheck);  // Admin saare (filtered)

router.get("/:id", auth, getQuarterlySpotCheckById); // Fetch one (owner) — used for edit prefill
router.put("/:id", auth, updateQuarterlySpotCheck); // User edit (blocked once verified)

router.put("/verify/:id", auth,verifyAdmin, verifyQuarterlyspotcheck); // Admin verify
router.delete("/:id", auth, deleteQuarterlySpotCheck);

export default router;