import express from "express";
import { getDashboardOverview, getPendingApprovals } from "../controllers/dashboardStatsController.js";
import auth from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.get("/overview", auth, verifyAdmin, getDashboardOverview);
router.get("/pending", auth, verifyAdmin, getPendingApprovals);

export default router;