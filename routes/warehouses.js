// routes/warehouses.js
import express from "express";
import { getWarehouses, addWarehouse, updateWarehouse, deleteWarehouse, getWarehouseById } from "../controllers/warehouseController.js";
import auth from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { validateObjectIdParam } from "../middleware/security.js";

const router = express.Router();

// Warehouses sirf ADMIN manage kar sakta hai (pehle koi bhi logged-in user kar sakta tha)
router.use(auth, requireRole("admin"));
router.param("id", validateObjectIdParam);

router.get("/", getWarehouses);
router.post("/", addWarehouse);
router.put("/:id", updateWarehouse);
router.delete("/:id", deleteWarehouse);
router.get("/:id", getWarehouseById);

export default router;
