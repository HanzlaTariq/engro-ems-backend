import mongoose from "mongoose";

const SafetyTalkSchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  conductedBy: { type: String, required: true },
  noOfLabours: { type: Number, required: true },
  hcPresent: { type: String, enum: ["Yes", "No"], required: true },
  topic: { type: String, required: true },
  remarks: { type: String,  required: true },
  createdBy: {  // ✅ Ye add kar: User ID link
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
}, { timestamps: true });

const SafetyTalk = mongoose.model("SafetyTalk", SafetyTalkSchema);
export default SafetyTalk;
