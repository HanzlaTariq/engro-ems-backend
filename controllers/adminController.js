import Admin from "../models/Admin.js";
import Warehouse from "../models/Warehouse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";





// 🔹 Add new Admin
export const addAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Admin already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin
    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Admin created successfully", admin: newAdmin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔍 Admin login for:', email);

    const admin = await Admin.findOne({ email });
    console.log('👤 Admin found:', !!admin);

    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('🔑 Password match:', isMatch);

    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { _id: admin._id, role: "Admin" },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );
    console.log('✅ Token generated:', token.substring(0, 20) + '...');

    res.json({
      token,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (err) {
    console.error('💥 Login error:', err);
    res.status(500).json({ message: "Server error" });
  }
};



// 🔹 Add Warehouse In-charge
export const addWarehouseIncharge = async (req, res) => {
  try {
    const { name, email, password, warehouseId } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "WarehouseIncharge",
      warehouses: [warehouseId],
    });

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) return res.status(404).json({ msg: "Warehouse not found" });

    warehouse.incharge = newUser._id;
    await warehouse.save();

    res.status(201).json({ msg: "Warehouse In-charge added", user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// 🔹 Get DO's warehouses
export const getWarehousesByDO = async (req, res) => {
  try {
    const doId = req.user._id; // set by verifyToken middleware
    const warehouses = await Warehouse.find({ do: doId }).populate("incharge", "name email");
    res.json(warehouses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
