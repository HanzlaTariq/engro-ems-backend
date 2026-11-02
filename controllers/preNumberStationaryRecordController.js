import PreNumberStationaryRecord from "../models/PreNumberStationaryRecord.js";
import Warehouse from "../models/Warehouse.js";
import User from "../models/User.js";
import { notifyRecordReverted } from "../utils/notifyUser.js";

// Create (auto-set warehouse)
export const createPreNumberStationaryRecord = async (req, res) => {
  try {
    const { bookNo, receiptDate, from, to, startDate, endDate, purpose, storageLocation, plantCode, whiInitial } = req.body;

    if (!bookNo || !receiptDate || !from || !to ||  !purpose || !whiInitial) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get user's assigned warehouse
    const user = await User.findById(req.userId).populate("warehouse");
    const warehouseId = user?.warehouse?._id;

    if (!warehouseId) {
      return res.status(400).json({ message: "No warehouse assigned to you" });
    }

    const record = new PreNumberStationaryRecord({
      bookNo,
      receiptDate,
      from,
      to,
      startDate,
      endDate,
      purpose,
      storageLocation: storageLocation || "",
      plantCode: plantCode || "",
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

// Get MY (user's own records)
export const getMyPreNumberStationaryRecord = async (req, res) => {
  try {
    const records = await PreNumberStationaryRecord.find({ createdBy: req.userId })
      .populate("warehouse", "name location")
      .sort({ receiptDate: 1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Get ALL → Admin only (warehouses created by admin)
export const getPreNumberStationaryRecord = async (req, res) => {
  try {
    const adminId = req.userId;

    const adminWarehouses = await Warehouse.find({ createdBy: adminId }).select("_id");
    const warehouseIds = adminWarehouses.map(w => w._id);

    const records = await PreNumberStationaryRecord.find({
      warehouse: { $in: warehouseIds }
    })
      .populate("warehouse", "name location")
      .populate("createdBy", "email")
      .sort({ receiptDate: 1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Update (user can update ONLY their own AND only if not verified)
export const updatePreNumberStationaryRecord = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the existing record
    const existing = await PreNumberStationaryRecord.findOne({
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

    // Prepare update data. Never trust status-related fields from the client —
    // editing a previously reverted record resubmits it for DO review, so the
    // status, reviewer, and rejection info are always reset here explicitly.
    const updateData = { ...req.body };

    delete updateData.doVerified;
    delete updateData.doEmail;
    delete updateData.rejectionReason;
    delete updateData.rejectedAt;
    delete updateData.warehouse;
    delete updateData.createdBy;
    delete updateData._id;

    updateData.doVerified = "DO Not Verified";
    updateData.doEmail = "";
    updateData.rejectionReason = "";
    updateData.rejectedAt = null;

    const updated = await PreNumberStationaryRecord.findByIdAndUpdate(
      id,
      updateData,
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

// Verify (Admin Only — role check REMOVED because middleware handles)
export const verifyPreNumberStationaryRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user?.email; // server se (client ki di hui email trust nahi)

    const record = await PreNumberStationaryRecord.findById(id).populate("warehouse");

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Admin can only verify records from warehouses they created
    if (record.warehouse.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "You can only verify records from your own warehouses" });
    }

    // Check if already verified
    if (record.doVerified === "Verified") {
      return res.status(400).json({ message: "Record is already verified" });
    }

    const updated = await PreNumberStationaryRecord.findByIdAndUpdate(
      id,
      { 
        doVerified: "Verified", 
        doEmail: adminEmail,
        verifiedAt: new Date()
      },
      { new: true }
    );

    res.json({ 
      success: true,
      message: "Record verified successfully", 
      updated 
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Delete (user: only their own & only if not verified) / Revert (Admin)
export const deletePreNumberStationaryRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await PreNumberStationaryRecord.findById(id).populate("warehouse");

    if (!existing) {
      return res.status(404).json({ message: "Record not found" });
    }

    const isAdmin = req.user?.role === "admin"; // role se check (pehle warehouse banane se admin ban jata tha)

    if (!isAdmin) {
      // User can delete only their own, unverified records
      if (existing.createdBy.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (existing.doVerified === "Verified") {
        return res.status(400).json({
          message: "Cannot delete a verified record. This record has been verified by DO."
        });
      }

      await PreNumberStationaryRecord.findByIdAndDelete(id);

      return res.json({
        success: true,
        message: "Record deleted successfully"
      });
    }

    // Admin path: revert instead of permanent delete, and notify the manager
    if (existing.warehouse.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Record not from your warehouse." });
    }

    const { reason } = req.body;

    const reverted = await PreNumberStationaryRecord.findByIdAndUpdate(
      id,
      {
        doVerified: "Rejected",
        rejectionReason: (reason || "").trim() || "No reason provided by DO",
        rejectedAt: new Date(),
      },
      { new: true }
    );

    await notifyRecordReverted({
      recipientId: existing.createdBy,
      module: "PreNumberStationaryRecord",
      recordId: existing._id,
      formLabel: "Pre-Numbered Stationary Record",
      reason,
      revertedBy: req.user?.email,
    });

    res.json({
      success: true,
      message: "Record reverted successfully. Warehouse manager has been notified.",
      reverted,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
