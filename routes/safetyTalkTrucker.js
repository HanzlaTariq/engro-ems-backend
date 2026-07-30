import express from "express";
import { 
  createSafetyTalkTrucker, 
  getSafetyTalkTrucker, 
  getMySafetyTalkTrucker, 
  updateSafetyTalkTrucker, 
  deleteSafetyTalkTrucker,
  verifySafetyTalkTrucker,
} from "../controllers/safetyTalkTruckerController.js";
import auth from "../middleware/authMiddleware.js";  // Tera middleware
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

// ✅ User-specific routes
router.post("/", auth, createSafetyTalkTrucker);
router.get("/my", auth, getMySafetyTalkTrucker);  // Sirf apne records
router.put("/:id", auth, updateSafetyTalkTrucker);
router.delete("/:id", auth, deleteSafetyTalkTrucker);

// ✅ Admin routes
router.get("/", auth, verifyAdmin, getSafetyTalkTrucker);  // Admin all (filtered)
router.put("/verify/:id", auth, verifyAdmin, verifySafetyTalkTrucker);  // Admin verify

export default router;