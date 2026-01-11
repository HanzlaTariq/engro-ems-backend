import SafetyTalkTrucker from "../models/safetyTalkTruckerModel.js";

// Create new safety talk record
export const createSafetyTalkTrucker = async (req, res) => {
  try {
    const { date, time, conductedBy, truckNo, driverName, topic, remarks } = req.body;

    if (!date || !time || !conductedBy || !truckNo || !driverName || !topic) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const record = new SafetyTalkTrucker({
      date,
      time,
      conductedBy,
      truckNo,
      driverName,
      topic,
      remarks: remarks || "Excellent",
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
      .sort({ date: -1, time: -1 });  // Latest first

    res.json({ records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Get ALL records (admin-only, optional)
export const getSafetyTalkTrucker = async (req, res) => {
  try {
    // Admin check (agar req.user.role available hai)
    if (req.user?.role !== 'warehouse_manager' && req.user?.role !== 'DO') {  // Adjust roles as per model
      return res.status(403).json({ message: "Access denied" });
    }

    const records = await SafetyTalkTrucker.find()
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
    const updates = req.body;

    // Ownership check
    const existing = await SafetyTalkTrucker.findOne({ _id: id, createdBy: req.userId });
    if (!existing) {
      return res.status(403).json({ message: "Access denied: Not your record" });
    }

    const updated = await SafetyTalkTrucker.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    res.json({ message: "Record updated successfully", updated });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

// Delete record (optional, agar chahiye)
export const deleteSafetyTalkTrucker = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await SafetyTalkTrucker.findOneAndDelete({ _id: id, createdBy: req.userId });
    if (!deleted) {
      return res.status(404).json({ message: "Record not found or access denied" });
    }

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting record" });
  }
};