import SafetyTalkTrucker from "../models/safetyTalkTruckerModel.js";
import Warehouse from "../models/Warehouse.js";
import User from "../models/User.js";
import { notifyRecordReverted } from "../utils/notifyUser.js";

// Create new safety talk record
export const createSafetyTalkTrucker = async (req, res) => {
  try {
    const { date, time, conductedBy, truckNo, driverName, topic, storageLocation, plantCode, remarks } = req.body;

    if (!date || !time || !conductedBy || !truckNo || !driverName || !topic) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get user's assigned warehouse
    const user = await User.findById(req.userId).populate("warehouse");
    const warehouseId = user?.warehouse?._id;

    if (!warehouseId) {
      return res.status(400).json({ message: "No warehouse assigned to you" });
    }

    const record = new SafetyTalkTrucker({
      date,
      time,
      conductedBy,
      truckNo,
      driverName,
      topic,
      storageLocation: storageLocation || "",
      plantCode: plantCode || "",
      remarks: remarks || "Excellent",
      doVerified: "DO Not Verified",
      warehouse: warehouseId,
      createdBy: req.userId  // ✅ Auto-set from middleware
    });

    await record.save();
    res.status(201).json({ message: "Safety talk recorded successfully", record });
  } catch (error) {
    console.error("Create error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get MY records (user-specific)
export const getMySafetyTalkTrucker = async (req, res) => {
  try {
    const userId = req.userId;
    const records = await SafetyTalkTrucker.find({ createdBy: userId })
      .populate("warehouse", "name location")
      .sort({ date: -1, time: -1 });  // Latest first

    res.json({ records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Get ALL records (admin-only, scoped to warehouses the admin created)
export const getSafetyTalkTrucker = async (req, res) => {
  try {
    const adminId = req.userId;

    const adminWarehouses = await Warehouse.find({ createdBy: adminId }).select("_id");
    const warehouseIds = adminWarehouses.map((w) => w._id);

    const records = await SafetyTalkTrucker.find({ warehouse: { $in: warehouseIds } })
      .populate("warehouse", "name location")
      .populate("createdBy", "email")
      .sort({ date: -1, time: -1 });

    res.json({ records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Update record
export const updateSafetyTalkTrucker = async (req, res) => {
  try {
    const { id } = req.params;

    // Ownership check
    const existing = await SafetyTalkTrucker.findOne({ _id: id, createdBy: req.userId });
    if (!existing) {
      return res.status(403).json({ message: "Access denied: Not your record" });
    }

    if (existing.doVerified === "Verified") {
      return res.status(400).json({
        message: "Cannot edit a verified record. This record has been verified by DO and cannot be modified."
      });
    }

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

    const updated = await SafetyTalkTrucker.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate("warehouse", "name location");

    res.json({ message: "Record updated successfully", updated });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Verify (Admin only)
export const verifySafetyTalkTrucker = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminEmail } = req.body;

    const record = await SafetyTalkTrucker.findById(id).populate("warehouse");

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (record.warehouse.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Record not from your warehouse" });
    }

    if (record.doVerified === "Verified") {
      return res.status(400).json({ message: "Record is already verified" });
    }

    const updated = await SafetyTalkTrucker.findByIdAndUpdate(
      id,
      { doVerified: "Verified", doEmail: adminEmail },
      { new: true }
    );

    res.json({ message: "Verified successfully", updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete record (user own & not verified / admin from own warehouse)
export const deleteSafetyTalkTrucker = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await SafetyTalkTrucker.findById(id).populate("warehouse");
    if (!record) {
      return res.status(404).json({ message: "Record not found or access denied" });
    }

    const isAdmin = await Warehouse.exists({ createdBy: req.userId });

    if (!isAdmin) {
      if (record.createdBy.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: "You can delete only your own records." });
      }
      if (record.doVerified === "Verified") {
        return res.status(400).json({ message: "Cannot delete a verified record." });
      }
    } else {
      if (record.warehouse.createdBy.toString() !== req.userId.toString()) {
        return res.status(403).json({ message: "Record not from your warehouse." });
      }

      // 🔁 REVERT instead of permanent delete + notify the manager
      const { reason } = req.body;

      const reverted = await SafetyTalkTrucker.findByIdAndUpdate(
        id,
        {
          doVerified: "Rejected",
          rejectionReason: (reason || "").trim() || "No reason provided by DO",
          rejectedAt: new Date(),
        },
        { new: true }
      );

      await notifyRecordReverted({
        recipientId: record.createdBy,
        module: "SafetyTalkTrucker",
        recordId: record._id,
        formLabel: "Safety Talk (Trucker) Record",
        reason,
        revertedBy: req.user?.email,
      });

      return res.json({
        success: true,
        message: "Record reverted successfully. Warehouse manager has been notified.",
        reverted,
      });
    }

    await SafetyTalkTrucker.findByIdAndDelete(id);
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting record" });
  }
};