import express from "express";
import { getUsers, addUser, assignWarehouses, toggleUserStatus } from "../controllers/userController.js";
import auth from "../middleware/authMiddleware.js";  // Admin auth

const router = express.Router();

router.get("/", auth, getUsers);  // Filtered users
router.post("/add", auth, addUser);  // Create
router.post("/assign-warehouses", auth, assignWarehouses);  // Assign to DO
router.put("/:id/status", auth, toggleUserStatus);  // Toggle status

export default router;