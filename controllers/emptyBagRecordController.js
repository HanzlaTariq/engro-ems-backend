import EmptyBagRecord from "../models/EmptyBagRecord.js";
import Warehouse from "../models/Warehouse.js";
import User from "../models/User.js";

// Create (auto-set warehouse)
export const createEmptyBagRecord = async (req, res) => {
  try {
    const {
      date,
      product,
      openingBalance,
      receiptQty,
      issuedQty,
      issuencePurpose,
      perRef,
      balanceQty,
      whiInitial
    } = req.body;

    if (
      !date ||
      !product ||
      !openingBalance ||
      !receiptQty ||
      !issuedQty ||
      !issuencePurpose ||
      !perRef ||
      !balanceQty ||
      !whiInitial
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get user's assigned warehouse
    const user = await User.findById(req.userId).populate("warehouse");
    const warehouseId = user?.warehouse?._id;

    if (!warehouseId) {
      return res.status(400).json({ message: "No warehouse assigned to you" });
    }

    const record = new EmptyBagRecord({
      date,
      product,
      openingBalance,
      receiptQty,
      issuedQty,
      issuencePurpose,
      perRef,
      balanceQty,
      whiInitial,
      doVerified: "DO Not Verified",
      warehouse: warehouseId,
      createdBy: req.userId
    });

    await record.save();
    res.status(201).json({ message: "Record saved", record });
  } catch (error) {
    console.error("Create error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get MY records (user-only)
export const getMyEmptyBagRecord = async (req, res) => {
  try {
    const records = await EmptyBagRecord.find({ createdBy: req.userId })
      .populate("warehouse", "name location")
      .sort({ date: -1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Get ALL records (Admin only)
export const getEmptyBagRecord = async (req, res) => {
  try {
    const adminId = req.userId;

    // Only warehouses created by this admin
    const adminWarehouses = await Warehouse.find({ createdBy: adminId }).select("_id");
    const warehouseIds = adminWarehouses.map(w => w._id);

    const records = await EmptyBagRecord.find({
      warehouse: { $in: warehouseIds }
    })
      .populate("warehouse", "name location")
      .populate("createdBy", "email")
      .sort({ date: 1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Update (user can update only their own AND only if not verified)
export const updateEmptyBagRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await EmptyBagRecord.findOne({
      _id: id,
      createdBy: req.userId
    });

    if (!existing) {
      return res.status(403).json({ message: "Access denied. You can only edit your own records." });
    }

    // Check if record is already verified by DO
    if (existing.doVerified === "Verified") {
      return res.status(400).json({ 
        success: false,
        message: "Cannot edit a verified record. This record has been verified by DO and cannot be modified." 
      });
    }

    const updated = await EmptyBagRecord.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    ).populate("warehouse", "name location");

    res.json({ 
      success: true,
      message: "Record updated successfully",
      updated 
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(400).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Verify (Admin only)
export const verifyEmptyBagRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminEmail } = req.body;

    const record = await EmptyBagRecord.findById(id).populate("warehouse");

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (record.warehouse.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Record not from your warehouse" });
    }

    const updated = await EmptyBagRecord.findByIdAndUpdate(
      id,
      { doVerified: "Verified", doEmail: adminEmail },
      { new: true }
    );

    res.json({ message: "Verified successfully", updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



// Delete (User can delete only their own & only if not verified / Admin can delete from their warehouse)
export const deleteEmptyBagRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the record with warehouse + createdBy
    const record = await EmptyBagRecord.findById(id).populate("warehouse");

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // If user is NOT admin → user logic applies
    const isAdmin = await Warehouse.exists({ createdBy: req.userId });

    if (!isAdmin) {
      // User can delete only their records
      if (record.createdBy.toString() !== req.userId.toString()) {
        return res.status(403).json({
          message: "You can delete only your own records."
        });
      }

      // Verified records cannot be deleted
      if (record.doVerified === "Verified") {
        return res.status(400).json({
          message: "Cannot delete a verified record."
        });
      }
    } else {
      // Admin can delete only records inside their warehouse(s)
      if (record.warehouse.createdBy.toString() !== req.userId.toString()) {
        return res.status(403).json({
          message: "Record not from your warehouse."
        });
      }
    }

    await EmptyBagRecord.findByIdAndDelete(id);

    res.json({ message: "Record deleted successfully" });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting record" });
  }
};
