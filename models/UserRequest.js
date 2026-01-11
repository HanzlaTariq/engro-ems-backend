import mongoose from "mongoose";

const userRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["WarehouseIncharge"], default: "WarehouseIncharge" },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
}, { timestamps: true });

export default mongoose.model("UserRequest", userRequestSchema);
