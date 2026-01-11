import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  address: String,
  capacity: String,
  contactPerson: String,
  contactPhone: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User"}
}, { timestamps: true });

const Warehouse = mongoose.model("Warehouse", warehouseSchema);
export default Warehouse;
