import PreNumberStationaryRecord from "../models/PreNumberStationaryRecord.js";
import Warehouse from "../models/Warehouse.js";
import User from "../models/User.js";

// Create (auto-set warehouse)
export const createPreNumberStationaryRecord = async (req, res) => {
  try {
    const { bookNo, receiptDate, from, to, startDate, endDate, purpose, whiInitial } = req.body;

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

    // Prepare update data
    const updateData = { ...req.body };
    
    // Remove fields that shouldn't be updated
    delete updateData.doVerified;
    delete updateData.doEmail;
    delete updateData.warehouse;
    delete updateData.createdBy;

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
    const { adminEmail } = req.body;

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

// Delete (only if not verified)
export const deletePreNumberStationaryRecord = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await PreNumberStationaryRecord.findById(id);

    if (!existing) {
      return res.status(404).json({ message: "Record not found" });
    }

    // Allow admin to delete any record OR creator to delete
    if (existing.createdBy.toString() !== req.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if record is verified
    if (existing.doVerified === "Verified") {
      return res.status(400).json({ 
        message: "Cannot delete a verified record. This record has been verified by DO." 
      });
    }

    await PreNumberStationaryRecord.findByIdAndDelete(id);

    res.json({ 
      success: true,
      message: "Record deleted successfully" 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
