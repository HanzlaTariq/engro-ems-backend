import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  getMyNotifications,
  dismissNotification,
  dismissAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

// Any logged-in user (warehouse manager or admin) can read/dismiss their own notifications
router.get("/my", auth, getMyNotifications);
router.put("/dismiss/:id", auth, dismissNotification);
router.put("/dismiss-all", auth, dismissAllNotifications);

export default router;
