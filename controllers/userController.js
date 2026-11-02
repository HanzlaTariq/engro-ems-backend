import mongoose from "mongoose";
import User from "../models/User.js";
import Warehouse from "../models/Warehouse.js";
import bcrypt from "bcryptjs";
import { isEmail, isStrongPassword, PASSWORD_RULE_MSG } from "../middleware/security.js";

const ALLOWED_ROLES = ["warehouse_manager", "DO"];
const isId = (v) => typeof v === "string" && mongoose.Types.ObjectId.isValid(v) && /^[a-fA-F0-9]{24}$/.test(v);
const optStr = (v, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

// Email case-insensitive duplicate check (collation), purane mixed-case emails ko bhi pakadta hai
const emailTaken = (email, excludeId) => {
  const filter = { email };
  if (excludeId) filter._id = { $ne: excludeId };
  return User.findOne(filter).collation({ locale: "en", strength: 2 }).select("_id");
};

// Response se sensitive fields hata do
const toSafeUser = (userDoc) => {
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  delete obj.password;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

const handleError = (res, err, tag) => {
  if (err?.code === 11000) return res.status(400).json({ message: "Email already exists" });
  if (err?.name === "ValidationError") return res.status(400).json({ message: err.message });
  if (err?.name === "CastError") return res.status(400).json({ message: "Invalid data" });
  console.error(`${tag} error:`, err?.message);
  return res.status(500).json({ message: "Server error" });
};

// Get users (filtered by admin's warehouses)
export const getUsers = async (req, res) => {
  try {
    const adminId = req.userId;

    const adminWarehouses = await Warehouse.find({ createdBy: adminId }).select("_id");
    const warehouseIds = adminWarehouses.map((w) => w._id);

    const users = await User.find({
      createdBy: adminId,
      $or: [
        { warehouse: { $in: warehouseIds } },
        { warehouses: { $in: warehouseIds } },
      ],
    })
      .select("-password -loginAttempts -lockUntil")
      .populate("warehouse warehouses", "name location");

    res.json(users);
  } catch (err) {
    handleError(res, err, "getUsers");
  }
};

// Add new user (warehouse validate)
export const addUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, city, province, address, warehouse } = req.body || {};
    const adminId = req.userId;

    if (typeof name !== "string" || !name.trim() || name.length > 100) {
      return res.status(400).json({ message: "Valid name is required" });
    }
    if (!isEmail(email)) return res.status(400).json({ message: "Valid email is required" });
    if (!isStrongPassword(password)) return res.status(400).json({ message: PASSWORD_RULE_MSG });
    if (!ALLOWED_ROLES.includes(role)) return res.status(400).json({ message: "Invalid role" });
    if (warehouse !== undefined && warehouse !== null && warehouse !== "" && !isId(warehouse)) {
      return res.status(400).json({ message: "Invalid warehouse" });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (await emailTaken(cleanEmail)) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Validate warehouse belongs to admin
    if (warehouse) {
      const wh = await Warehouse.findOne({ _id: warehouse, createdBy: adminId });
      if (!wh) return res.status(403).json({ message: "Warehouse not assigned to you" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role,
      phone: optStr(phone, 30),
      city: optStr(city, 100),
      province: optStr(province, 100),
      address: optStr(address, 300),
      warehouse: role === "warehouse_manager" ? warehouse || undefined : undefined,
      warehouses: role === "DO" ? [] : undefined,
      status: "active",
      createdBy: adminId,
    });

    await newUser.save();

    // Password hash response mein nahi jayega
    res.status(201).json({ message: "User created successfully", user: toSafeUser(newUser) });
  } catch (err) {
    handleError(res, err, "addUser");
  }
};

// Update user details
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, city, province, address, warehouse } = req.body || {};
    const adminId = req.userId;

    const user = await User.findOne({ _id: id, createdBy: adminId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.length > 100) {
        return res.status(400).json({ message: "Valid name is required" });
      }
      updates.name = name.trim();
    }

    if (email !== undefined && email !== user.email) {
      if (!isEmail(email)) return res.status(400).json({ message: "Valid email is required" });
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== user.email.toLowerCase() && (await emailTaken(cleanEmail, id))) {
        return res.status(400).json({ message: "Email already exists" });
      }
      updates.email = cleanEmail;
    }

    if (phone !== undefined) updates.phone = optStr(phone, 30);
    if (city !== undefined) updates.city = optStr(city, 100);
    if (province !== undefined) updates.province = optStr(province, 100);
    if (address !== undefined) updates.address = optStr(address, 300);

    if (user.role === "warehouse_manager" && warehouse) {
      if (!isId(warehouse)) return res.status(400).json({ message: "Invalid warehouse" });
      const wh = await Warehouse.findOne({ _id: warehouse, createdBy: adminId });
      if (!wh) return res.status(403).json({ message: "Warehouse not assigned to you" });
      updates.warehouse = warehouse;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .select("-password -loginAttempts -lockUntil")
      .populate("warehouse warehouses", "name location");

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    handleError(res, err, "updateUser");
  }
};

// Assign warehouses to DO (warehouse validate)
export const assignWarehouses = async (req, res) => {
  try {
    const { userId, warehouseIds } = req.body || {};
    const adminId = req.userId;

    if (!isId(userId) || !Array.isArray(warehouseIds) || !warehouseIds.every(isId)) {
      return res.status(400).json({ message: "Invalid data" });
    }
    const uniqueIds = [...new Set(warehouseIds)];

    // Validate user belongs to admin
    const user = await User.findOne({ _id: userId, createdBy: adminId, role: "DO" });
    if (!user) return res.status(403).json({ message: "User not found or not DO" });

    // Validate warehouses belong to admin
    const adminWarehouses = await Warehouse.find({ _id: { $in: uniqueIds }, createdBy: adminId });
    if (adminWarehouses.length !== uniqueIds.length) {
      return res.status(403).json({ message: "Some warehouses not assigned to you" });
    }

    await User.findByIdAndUpdate(userId, { warehouses: uniqueIds });

    res.json({ message: "Warehouses assigned successfully" });
  } catch (err) {
    handleError(res, err, "assignWarehouses");
  }
};

// Toggle user status
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.userId;

    const user = await User.findOne({ _id: id, createdBy: adminId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const newStatus = user.status === "active" ? "inactive" : "active";
    await User.findByIdAndUpdate(id, { status: newStatus });

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    handleError(res, err, "toggleUserStatus");
  }
};
