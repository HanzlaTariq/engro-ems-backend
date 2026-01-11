import express from "express";
import { createSafetyTalk, getSafetyTalk, getMySafetyTalk, updateSafetyTalk } from "../controllers/safetyTalkController.js";
import auth from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", auth, createSafetyTalk);
router.get("/my", auth, getMySafetyTalk);  // Sirf apne
router.get("/", auth, getSafetyTalk);  // Admin all
router.put("/:id", auth, updateSafetyTalk);

export default router;