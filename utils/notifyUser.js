import Notification from "../models/Notification.js";

/**
 * Creates a persistent "record reverted" notification for a warehouse manager.
 * Used whenever an Admin/DO reverts (rejects) a submitted record instead of
 * silently deleting it, so the manager always finds out and knows why.
 *
 * This never throws — a notification failure should never block the
 * revert action itself, so errors are only logged.
 */
export const notifyRecordReverted = async ({
  recipientId,
  module,
  recordId,
  formLabel,
  reason,
  revertedBy,
}) => {
  try {
    if (!recipientId) return;

    const cleanReason = (reason || "").trim();

    await Notification.create({
      recipient: recipientId,
      type: "RECORD_REVERTED",
      module,
      recordId,
      title: `${formLabel} Reverted by DO`,
      message: cleanReason
        ? `Your "${formLabel}" entry was reverted by the DO. Reason: ${cleanReason}`
        : `Your "${formLabel}" entry was reverted by the DO and needs your attention.`,
      reason: cleanReason,
      revertedBy: revertedBy || "",
    });
  } catch (error) {
    console.error("notifyRecordReverted error:", error.message);
  }
};

export default notifyRecordReverted;
