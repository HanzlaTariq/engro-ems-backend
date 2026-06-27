import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    timeIn: {
      type: String,
      required: true,
    },
    timeOut: {
      type: String,
      required: true,
    },
    extraTime: {
      type: String, 
      default: "0m",
    },
    directDiversion: {
      type: Number,
      default: 0,
    },
    totalHandling: {
      type: Number,
      default: 0,
    },
    Location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    plantCode: {
      type: String,
      required: [true, "Plant is required"],
      trim: true,
    },
    whiSignature: {
      type: String,
      required: [true, "Signature is required"],
      trim: true,
    },
    createdBy: {  // ✅ Ye add kar: User ID link
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", AttendanceSchema);