import express from "express";
import { loginAdmin, addWarehouseIncharge, getWarehousesByDO } from "../controllers/adminController.js";
import  verifyToken  from "../middleware/authMiddleware.js"; // JWT verify middleware
import { addAdmin } from "../controllers/adminController.js";

const router = express.Router();

// Admin login (no token required)
router.post("/login", loginAdmin);

// Protected routes
router.post("/add-incharge", verifyToken, addWarehouseIncharge);
router.get("/warehouses", verifyToken, getWarehousesByDO);
// Protected route: only logged-in admin can add another admin
router.post("/add-admin", verifyToken, addAdmin);



// ⚠️ TEMPORARY – only for first admin
router.post("/create-first-admin", addAdmin);



export default router;
