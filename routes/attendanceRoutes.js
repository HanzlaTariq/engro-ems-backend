import express from "express";
import {
  createAttendance,
  getAttendances,
  updateAttendance,
  getMyAttendances,
  deleteAttendance,
  verifyAttendance,
} from "../controllers/attendanceController.js";
import verifyToken from "../middleware/authMiddleware.js";  // Tera auth middleware
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/", verifyToken, createAttendance);  // ✅ Ye zaroori – middleware add kar
router.get("/my", verifyToken, getMyAttendances);
router.put("/:id", verifyToken, updateAttendance);
router.delete("/:id", verifyToken, deleteAttendance);  // Delete route

router.get("/", verifyToken, verifyAdmin, getAttendances);  // Admin only
router.put("/verify/:id", verifyToken, verifyAdmin, verifyAttendance);  // Admin verify

export default router;