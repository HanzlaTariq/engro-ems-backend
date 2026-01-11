import express from "express";
import { createWeeklySpotCheck, getWeeklySpotCheck, getMyWeeklySpotCheck,verifyWeeklyspotcheck,deleteWeekySpotCheck } from "../controllers/weeklySpotCheckController.js";
import auth from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";


const router = express.Router();

router.post("/", auth, createWeeklySpotCheck);
router.get("/my", auth, getMyWeeklySpotCheck);  // User apne
router.get("/", auth, getWeeklySpotCheck);  // Admin saare (filtered)

router.put("/verify/:id", auth,verifyAdmin, verifyWeeklyspotcheck); // Admin verify
router.delete("/:id", auth, deleteWeekySpotCheck);

export default router;