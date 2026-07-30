import express from "express";
import { getDashboardOverview } from "../controllers/dashboardStatsController.js";
import auth from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.get("/overview", auth, verifyAdmin, getDashboardOverview);

export default router;