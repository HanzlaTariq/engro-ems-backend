import QuarterlySpotCheck from "../models/QuarterlySpotCheck.js";
import Warehouse from "../models/Warehouse.js";
import User from "../models/User.js";

// Create (auto-set warehouse)
export const createQuarterlySpotCheck = async (req, res) => {
  try {
    const formData = req.body;

    // Auto-set warehouse from user's primary warehouse
    const user = await User.findById(req.userId).populate('warehouse');
    const warehouseId = user?.warehouse?._id;
    if (!warehouseId) {
      return res.status(400).json({ message: "No warehouse assigned to you" });
    }

    const record = new QuarterlySpotCheck({
      ...formData,
      warehouse: warehouseId,  // Auto-set
      createdBy: req.userId
    });

    await record.save();
    res.status(201).json({ message: "Spot check saved", record });
  } catch (error) {
    console.error("Create error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get MY (user's records)
export const getMyQuarterlySpotCheck = async (req, res) => {
  try {
    const records = await QuarterlySpotCheck.find({ createdBy: req.userId })
      .populate('warehouse', 'name location')  // Warehouse name
      .sort({ date: 1 });

    res.json({ data: records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};

// Get ALL (admin – filtered by admin's warehouses)
export const getQuarterlySpotCheck = async (req, res) => {
  try {
    const adminId = req.userId;

    // Admin's warehouses
    const adminWarehouses = await Warehouse.find({ createdBy: adminId }).select('_id');
    const warehouseIds = adminWarehouses.map(w => w._id);

    const records = await QuarterlySpotCheck.find({ warehouse: { $in: warehouseIds } })
      .populate('warehouse', 'name location')
      .populate('createdBy', 'email')
      .sort({ date: 1 });

    res.json({ data: records });
  } catch (error) {
    res.status(500).json({ message: "Error fetching records" });
  }
};


export const verifyQuarterlyspotcheck = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminEmail } = req.body;

    const record = await QuarterlySpotCheck.findById(id).populate("warehouse");

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (record.warehouse.createdBy.toString() !== req.userId.toString()) {
      return res.status(403).json({ message: "Record not from your warehouse" });
    }

    const updated = await QuarterlySpotCheck.findByIdAndUpdate(
      id,
      { verifiedBy: "Verified", doEmail: adminEmail },
      { new: true }
    );

    res.json({ message: "Verified successfully", updated });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


export const deleteQuarterlySpotCheck = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the record with warehouse + createdBy
    const record = await QuarterlySpotCheck.findById(id).populate("warehouse");

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
      if (record.verifiedBy === "Verified") {
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

    await QuarterlySpotCheck.findByIdAndDelete(id);

    res.json({ message: "Record deleted successfully" });

  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting record" });
  }
};