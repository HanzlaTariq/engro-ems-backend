import SafetyTalk from "../models/SafetyTalk.js";
import Warehouse from "../models/Warehouse.js";
import User from "../models/User.js";
import { notifyRecordReverted } from "../utils/notifyUser.js";

// Create
export const createSafetyTalk = async (req, res) => {
  try {
    const { date, time, conductedBy, noOfLabours, hcPresent, topic, storageLocation, plantCode, remarks } = req.body;

    if (!date || !time || !conductedBy || !noOfLabours || !hcPresent || !topic) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Get user's assigned warehouse
    const user = await User.findById(req.userId).populate("warehouse");
    const warehouseId = user?.warehouse?._id;

    if (!warehouseId) {
      return res.status(400).json({ message: "No warehouse assigned to you" });
    }

    const record = new SafetyTalk({
      date,
      time,
      conductedBy,
      noOfLabours,
      hcPresent,
      topic,
      storageLocation: storageLocation || "",
      plantCode: plantCode || "",
      remarks: remarks || "Excellent",
      doVerified: "DO Not Verified",
      warehouse: warehouseId,
      createdBy: req.userId  // ✅ Auto-set
    });

    await record.save();
    res.status(201).json({ message: "Safety talk saved", record });
  } catch (error) {
    console.error("Create error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get MY (user-specific)
export const getMySafetyTalk = async (req, res) => {
  try {
    const records = await SafetyTalk.find({ createdBy: req.userId })
      .populate("warehouse", "name location")
      .sort({ date: -1, time: -1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Get ALL (admin-only, scoped to warehouses the admin created)
export const getSafetyTalk = async (req, res) => {
  try {
    const adminId = req.userId;

    const adminWarehouses = await Warehouse.find({ createdBy: adminId }).select("_id");
    const warehouseIds = adminWarehouses.map((w) => w._id);

    const records = await SafetyTalk.find({ warehouse: { $in: warehouseIds } })
      .populate("warehouse", "name location")
      .populate("createdBy", "email")
      .sort({ date: -1, time: -1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Update (user can update only their own AND only if not verified)
export const updateSafetyTalk = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await SafetyTalk.findOne({ _id: id, createdBy: req.userId });
    if (!existing) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (existing.doVerified === "Verified") {
      return res.status(400).json({
        message: "Cannot edit a verified record. This record has been verified by DO and cannot be modified."
      });
    }

    // Never trust status-related fields from the client — editing a
    // previously reverted record resubmits it for DO review.
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

    const updated = await SafetyTalk.findByIdAndUpdate(id, updateData, { new: true })
      .populate("warehouse", "name location");

    res.json({ success: true, message: "Record updated successfully", updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Verify (Admin only)
export const verifySafetyTalk = async (req, res) => {
  try {
    const { id } = req.params;
    const adminEmail = req.user?.email; // server se (client ki di hui email trust nahi)

    const record = await SafetyTalk.findById(id).populate("warehouse");

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (record.warehouse.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Record not from your warehouse" });
    }

    if (record.doVerified === "Verified") {
      return res.status(400).json({ message: "Record is already verified" });
    }

    const updated = await SafetyTalk.findByIdAndUpdate(
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
export const deleteSafetyTalk = async (req, res) => {
  try {
    const { id } = req.params;

    const record = await SafetyTalk.findById(id).populate("warehouse");
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    const isAdmin = req.user?.role === "admin"; // role se check (pehle warehouse banane se admin ban jata tha)

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

      const reverted = await SafetyTalk.findByIdAndUpdate(
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
        module: "SafetyTalk",
        recordId: record._id,
        formLabel: "Safety Talk Record",
        reason,
        revertedBy: req.user?.email,
      });

      return res.json({
        success: true,
        message: "Record reverted successfully. Warehouse manager has been notified.",
        reverted,
      });
    }

    await SafetyTalk.findByIdAndDelete(id);
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting record" });
  }
};