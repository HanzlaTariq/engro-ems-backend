import mongoose from "mongoose";

const preNumberStationaryRecordSchema = new mongoose.Schema({
  bookNo: { type: String, required: true },
  receiptDate: { type: Date, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  startDate: { type: Date },
  endDate: { type: Date },
  purpose: { type: String, required: true },
  whiInitial: { type: String, required: true },
  doVerified: { type: String, default: "DO Not Verified" },
  doEmail: { type: String },
  warehouse: {  // Auto-set
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true
  },
  createdBy: {  // User ID for isolation
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

export default mongoose.model("PreNumberStationaryRecord", preNumberStationaryRecordSchema);