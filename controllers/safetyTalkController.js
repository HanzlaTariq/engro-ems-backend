import SafetyTalk from "../models/SafetyTalk.js";

// Create
export const createSafetyTalk = async (req, res) => {
  try {
    const { date, time, conductedBy, noOfLabours, hcPresent, topic, remarks } = req.body;

    if (!date || !time || !conductedBy || !noOfLabours || !hcPresent || !topic) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const record = new SafetyTalk({
      date,
      time,
      conductedBy,
      noOfLabours,
      hcPresent,
      topic,
      remarks: remarks || "Excellent",
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
      .sort({ date: -1, time: -1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Get ALL (admin-only)
export const getSafetyTalk = async (req, res) => {
  try {
    // Role check
    if (!['warehouse_manager', 'DO'].includes(req.user?.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const records = await SafetyTalk.find()
      .sort({ date: -1, time: -1 });

    res.json({ records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Update
export const updateSafetyTalk = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await SafetyTalk.findOne({ _id: id, createdBy: req.userId });
    if (!existing) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updated = await SafetyTalk.findByIdAndUpdate(id, updates, { new: true });
    res.json({ updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};