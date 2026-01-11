import express from "express";
import {
  createPreNumberStationaryRecord,
  getPreNumberStationaryRecord,
  getMyPreNumberStationaryRecord,
  updatePreNumberStationaryRecord,
  verifyPreNumberStationaryRecord,
  deletePreNumberStationaryRecord
} from "../controllers/preNumberStationaryRecordController.js";

import auth from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

// USER ROUTES
router.post("/", auth, createPreNumberStationaryRecord);
router.get("/my", auth, getMyPreNumberStationaryRecord);
router.put("/:id", auth, updatePreNumberStationaryRecord);
router.delete("/:id", auth, deletePreNumberStationaryRecord);

// ADMIN ROUTES
router.get("/", auth, verifyAdmin, getPreNumberStationaryRecord);
router.put("/verify/:id", auth, verifyAdmin, verifyPreNumberStationaryRecord);

export default router;
