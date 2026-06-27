import express from "express";
import { createAttendance, getAttendances, updateAttendance, getMyAttendances ,deleteAttendance} from "../controllers/attendanceController.js";
import verifyToken from "../middleware/authMiddleware.js";  // Tera auth middleware

const router = express.Router();

router.post("/", verifyToken, createAttendance);  // ✅ Ye zaroori – middleware add kar
router.get("/", verifyToken, getAttendances);  // Admin only
router.get("/my", verifyToken, getMyAttendances);
router.put("/:id", verifyToken, updateAttendance);
router.delete("/:id", verifyToken, deleteAttendance);  // Delete route

export default router;