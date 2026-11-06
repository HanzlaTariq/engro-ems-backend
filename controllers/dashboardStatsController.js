import Warehouse from "../models/Warehouse.js";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import SafetyTalk from "../models/SafetyTalk.js";
import SafetyTalkTrucker from "../models/safetyTalkTruckerModel.js";
import EmptyBagRecord from "../models/EmptyBagRecord.js";
import PreNumberStationaryRecord from "../models/PreNumberStationaryRecord.js";
import WeeklySpotCheck from "../models/WeeklySpotCheck.js";
import QuarterlySpotCheck from "../models/QuarterlySpotCheck.js";

// "pending" = admin ke approval ka intezar (na Verified, na Rejected/reverted).
// Reverted records user ke paas wapas hote hain, isliye wo admin ke pending me nahi ginay jate.
const countByField = async (Model, field, warehouseIds) => {
  const filter = { warehouse: { $in: warehouseIds } };
  const [total, verified, rejected] = await Promise.all([
    Model.countDocuments(filter),
    Model.countDocuments({ ...filter, [field]: "Verified" }),
    Model.countDocuments({ ...filter, [field]: "Rejected" }),
  ]);
  return { total, verified, rejected, pending: total - verified - rejected };
};

// Helper: count total / verified / pending for a model that uses `doVerified`
const countDoVerifiedModule = (Model, warehouseIds) => countByField(Model, "doVerified", warehouseIds);

// Helper: count total / verified / pending for a model that uses `verifiedBy`
const countVerifiedByModule = (Model, warehouseIds) => countByField(Model, "verifiedBy", warehouseIds);

// GET /api/dashboard-stats/pending (Admin only) — chhota/tez endpoint: sidebar badges + dashboard panel
export const getPendingApprovals = async (req, res) => {
  try {
    const warehouses = await Warehouse.find({ createdBy: req.userId }).select("_id");
    const warehouseIds = warehouses.map((w) => w._id);

    const [attendance, safetyTalk, safetyTalkTrucker, emptyBag, preStationary, weeklySpotCheck, quarterlySpotCheck] =
      await Promise.all([
        countDoVerifiedModule(Attendance, warehouseIds),
        countDoVerifiedModule(SafetyTalk, warehouseIds),
        countDoVerifiedModule(SafetyTalkTrucker, warehouseIds),
        countDoVerifiedModule(EmptyBagRecord, warehouseIds),
        countDoVerifiedModule(PreNumberStationaryRecord, warehouseIds),
        countVerifiedByModule(WeeklySpotCheck, warehouseIds),
        countVerifiedByModule(QuarterlySpotCheck, warehouseIds),
      ]);

    const counts = {
      attendance: attendance.pending,
      safetyTalk: safetyTalk.pending,
      safetyTalkTrucker: safetyTalkTrucker.pending,
      emptyBag: emptyBag.pending,
      preStationary: preStationary.pending,
      weeklySpotCheck: weeklySpotCheck.pending,
      quarterlySpotCheck: quarterlySpotCheck.pending,
    };
    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    res.json({ counts, total });
  } catch (err) {
    console.error("Pending approvals error:", err);
    res.status(500).json({ message: "Error fetching pending approvals" });
  }
};

// GET /api/dashboard-stats/overview (Admin only)
export const getDashboardOverview = async (req, res) => {
  try {
    const adminId = req.userId;

    const warehouses = await Warehouse.find({ createdBy: adminId }).sort({ createdAt: -1 });
    const warehouseIds = warehouses.map((w) => w._id);

    const totalCapacity = warehouses.reduce((sum, w) => {
      const num = parseFloat(w.capacity);
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const activeWarehouses = warehouses.filter((w) => (w.status || "Active") === "Active").length;
    const inactiveWarehouses = warehouses.length - activeWarehouses;

    const users = await User.find({ createdBy: adminId });
    const activeUsers = users.filter((u) => u.status === "active").length;
    const inactiveUsers = users.length - activeUsers;

    const [
      attendance,
      safetyTalk,
      safetyTalkTrucker,
      emptyBag,
      preStationary,
      weeklySpotCheck,
      quarterlySpotCheck,
    ] = await Promise.all([
      countDoVerifiedModule(Attendance, warehouseIds),
      countDoVerifiedModule(SafetyTalk, warehouseIds),
      countDoVerifiedModule(SafetyTalkTrucker, warehouseIds),
      countDoVerifiedModule(EmptyBagRecord, warehouseIds),
      countDoVerifiedModule(PreNumberStationaryRecord, warehouseIds),
      countVerifiedByModule(WeeklySpotCheck, warehouseIds),
      countVerifiedByModule(QuarterlySpotCheck, warehouseIds),
    ]);

    const pendingVerifications =
      attendance.pending +
      safetyTalk.pending +
      safetyTalkTrucker.pending +
      emptyBag.pending +
      preStationary.pending +
      weeklySpotCheck.pending +
      quarterlySpotCheck.pending;

    res.json({
      warehouses: {
        total: warehouses.length,
        active: activeWarehouses,
        inactive: inactiveWarehouses,
        totalCapacity,
        list: warehouses.map((w) => ({
          _id: w._id,
          name: w.name,
          location: w.location,
          city: w.city,
          province: w.province,
          capacity: w.capacity,
          status: w.status || "Active",
          contactPerson: w.contactPerson,
          contactPhone: w.contactPhone,
        })),
      },
      users: {
        total: users.length,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      attendance,
      safetyTalk,
      safetyTalkTrucker,
      emptyBag,
      preStationary,
      weeklySpotCheck,
      quarterlySpotCheck,
      pendingVerifications,
    });
  } catch (err) {
    console.error("Dashboard overview error:", err);
    res.status(500).json({ message: "Error fetching dashboard overview" });
  }
};