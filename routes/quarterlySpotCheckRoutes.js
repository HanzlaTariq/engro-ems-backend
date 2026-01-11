import express from "express";
import { createQuarterlySpotCheck, getQuarterlySpotCheck, getMyQuarterlySpotCheck ,deleteQuarterlySpotCheck,verifyQuarterlyspotcheck } from "../controllers/QuarterlySpotCheckController.js";
import auth from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";


const router = express.Router();

router.post("/", auth, createQuarterlySpotCheck);
router.get("/my", auth, getMyQuarterlySpotCheck);  // User apne
router.get("/", auth, getQuarterlySpotCheck);  // Admin saare (filtered)

router.put("/verify/:id", auth,verifyAdmin, verifyQuarterlyspotcheck); // Admin verify
router.delete("/:id", auth, deleteQuarterlySpotCheck);

export default router;