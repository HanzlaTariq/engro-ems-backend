// models/User.js (add if not there)
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["warehouse_manager", "DO"], default: "warehouse_manager" },
  phone: { type: String },
  city: { type: String },
  province: { type: String },
  address: { type: String },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },  // For manager
  warehouses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" }],  // For DO
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdBy: {  // ✅ Admin ID for isolation
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);