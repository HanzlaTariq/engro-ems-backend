import User from "../models/User.js";
import Warehouse from "../models/Warehouse.js";
import bcrypt from "bcryptjs";

// Get users (filtered by admin's warehouses)
export const getUsers = async (req, res) => {
  try {
    const adminId = req.userId;

    const adminWarehouses = await Warehouse.find({ createdBy: adminId }).select('_id');
    const warehouseIds = adminWarehouses.map(w => w._id);

    const users = await User.find({ 
      createdBy: adminId,
      $or: [
        { warehouse: { $in: warehouseIds } },
        { warehouses: { $in: warehouseIds } }
      ]
    })
    .populate('warehouse warehouses', 'name location');

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// Add new user (warehouse validate)
export const addUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, city, province, address, warehouse } = req.body;
    const adminId = req.userId;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate warehouse belongs to admin
    if (warehouse) {
      const wh = await Warehouse.findOne({ _id: warehouse, createdBy: adminId });
      if (!wh) return res.status(403).json({ message: "Warehouse not assigned to you" });
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      city,
      province,
      address,
      warehouse: role === "warehouse_manager" ? warehouse : undefined,
      warehouses: role === "DO" ? [] : undefined,
      status: "active",
      createdBy: adminId  // ✅ Admin ID
    });

    await newUser.save();

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// Assign warehouses to DO (warehouse validate)
export const assignWarehouses = async (req, res) => {
  try {
    const { userId, warehouseIds } = req.body;
    const adminId = req.userId;

    // Validate user belongs to admin
    const user = await User.findOne({ _id: userId, createdBy: adminId, role: "DO" });
    if (!user) return res.status(403).json({ message: "User not found or not DO" });

    // Validate warehouses belong to admin
    const adminWarehouses = await Warehouse.find({ _id: { $in: warehouseIds }, createdBy: adminId });
    if (adminWarehouses.length !== warehouseIds.length) {
      return res.status(403).json({ message: "Some warehouses not assigned to you" });
    }

    await User.findByIdAndUpdate(userId, { warehouses: warehouseIds });

    res.json({ message: "Warehouses assigned successfully" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
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
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};