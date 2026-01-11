import express from "express";
import { 
  createSafetyTalkTrucker, 
  getSafetyTalkTrucker, 
  getMySafetyTalkTrucker, 
  updateSafetyTalkTrucker, 
  deleteSafetyTalkTrucker 
} from "../controllers/safetyTalkTruckerController.js";
import auth from "../middleware/authMiddleware.js";  // Tera middleware

const router = express.Router();

// ✅ User-specific aur admin routes
router.post("/", auth, createSafetyTalkTrucker);
router.get("/my", auth, getMySafetyTalkTrucker);  // Sirf apne records
router.get("/", auth, getSafetyTalkTrucker);  // Admin all
router.put("/:id", auth, updateSafetyTalkTrucker);
router.delete("/:id", auth, deleteSafetyTalkTrucker);  // Optional

export default router;