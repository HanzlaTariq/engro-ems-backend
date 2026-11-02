// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  // select:false -> password hash kabhi ghalti se API response mein nahi jayega
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["warehouse_manager", "DO"], default: "warehouse_manager" },
  phone: { type: String },
  city: { type: String },
  province: { type: String },
  address: { type: String },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },  // For manager
  warehouses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" }],  // For DO
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  createdBy: {  // Admin ID for isolation
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  // Login brute-force protection (DB based, Vercel par bhi kaam karta hai)
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
