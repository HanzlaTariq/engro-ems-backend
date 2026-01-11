import mongoose from "mongoose";

const safetyTalkTruckerSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    conductedBy: { type: String, required: true },
    truckNo: { type: String, required: true },
    driverName: { type: String, required: true },
    topic: { type: String, required: true },
    remarks: { type: String, default: "Excellent" },
    createdBy: {  // ✅ Ye add kar: User ID link
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
  },
  { timestamps: true }
);

const SafetyTalkTrucker = mongoose.model("SafetyTalkTrucker", safetyTalkTruckerSchema);

export default SafetyTalkTrucker;
