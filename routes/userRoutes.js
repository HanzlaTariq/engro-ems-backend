import express from "express";
import { getUsers, addUser, updateUser, assignWarehouses, toggleUserStatus } from "../controllers/userController.js";
import auth from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { validateObjectIdParam } from "../middleware/security.js";

const router = express.Router();

// Ye saare routes sirf ADMIN ke liye hain (pehle koi bhi logged-in user chala sakta tha)
router.use(auth, requireRole("admin"));
router.param("id", validateObjectIdParam);

router.get("/", getUsers);  // Filtered users
router.post("/add", addUser);  // Create
router.post("/assign-warehouses", assignWarehouses);  // Assign to DO
router.put("/:id/status", toggleUserStatus);  // Toggle status
router.put("/:id", updateUser);  // Update user details

export default router;
