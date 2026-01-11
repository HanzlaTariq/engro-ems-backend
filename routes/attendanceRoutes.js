import express from "express";
import { createAttendance, getAttendances, updateAttendance, getMyAttendances } from "../controllers/attendanceController.js";
import verifyToken from "../middleware/authMiddleware.js";  // Tera auth middleware

const router = express.Router();

router.post("/", verifyToken, createAttendance);  // ✅ Ye zaroori – middleware add kar
router.get("/", verifyToken, getAttendances);  // Admin only
router.get("/my", verifyToken, getMyAttendances);
router.put("/:id", verifyToken, updateAttendance);

export default router;