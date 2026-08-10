import mongoose from "mongoose";

// Persistent in-app notification.
// A notification stays visible on the recipient's dashboard until they
// explicitly dismiss it (isRead = true) — it is NEVER auto-hidden or
// auto-deleted just because time passed or the page was refreshed.
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      // The warehouse manager (User) who should see this notification
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["RECORD_REVERTED", "RECORD_VERIFIED", "GENERAL"],
      default: "RECORD_REVERTED",
    },
    module: {
      // Which form/collection this notification is about
      // e.g. "EmptyBagRecord", "SafetyTalk", "QuarterlySpotCheck"
      type: String,
      required: true,
    },
    recordId: {
      // The specific record that was reverted (if any)
      type: mongoose.Schema.Types.ObjectId,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    reason: {
      // Reason the DO/Admin gave for reverting the record
      type: String,
      default: "",
    },
    revertedBy: {
      // Admin's email/name, for display
      type: String,
      default: "",
    },
    isRead: {
      // Acts as "dismissed" — set true only when the user clicks the cross (×)
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
