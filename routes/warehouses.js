// routes/warehouseRoutes.js (ya jo bhi file hai warehouse routes ke liye)
import express from "express";
import { getWarehouses, addWarehouse, updateWarehouse, deleteWarehouse,getWarehouseById } from "../controllers/warehouseController.js";
import auth from "../middleware/authMiddleware.js";  // Import confirm kar

const router = express.Router();

// ✅ MUST: Har route pe auth middleware pehle lagao
router.get("/", auth, getWarehouses);  // GET pe ye lagana zaroori!
router.post("/", auth, addWarehouse);
router.put("/:id", auth, updateWarehouse);
router.delete("/:id", auth, deleteWarehouse);
router.get("/:id", auth, getWarehouseById);


export default router;