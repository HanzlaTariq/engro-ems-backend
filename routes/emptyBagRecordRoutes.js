import express from "express";
import { createEmptyBagRecord, getEmptyBagRecord, getMyEmptyBagRecord, updateEmptyBagRecord, verifyEmptyBagRecord,deleteEmptyBagRecord } from "../controllers/emptyBagRecordController.js";
import auth from "../middleware/authMiddleware.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

router.post("/",auth,createEmptyBagRecord);
router.get("/my",auth,getMyEmptyBagRecord);  // User apne
router.put("/:id",auth,updateEmptyBagRecord);
router.delete("/:id",auth,deleteEmptyBagRecord);


router.get("/", auth,verifyAdmin, getEmptyBagRecord);  // Admin saare (filtered)
router.put("/verify/:id", auth,verifyAdmin, verifyEmptyBagRecord);  // Admin verify

export default router;






