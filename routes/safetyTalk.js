import express from "express";
import {
  createSafetyTalk,
  getSafetyTalk,
  getMySafetyTalk,
  updateSafetyTalk,
  verifySafetyTalk,
  deleteSafetyTalk,
} from "../controllers/safetyTalkController.js";
import auth from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/", auth, createSafetyTalk);
router.get("/my", auth, getMySafetyTalk);  // Sirf apne
router.put("/:id", auth, updateSafetyTalk);
router.delete("/:id", auth, deleteSafetyTalk);

router.get("/", auth, verifyAdmin, getSafetyTalk);  // Admin all (filtered)
router.put("/verify/:id", auth, verifyAdmin, verifySafetyTalk);  // Admin verify

export default router;