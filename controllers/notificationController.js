import Notification from "../models/Notification.js";

// GET /api/notifications/my
// Returns only the ACTIVE (non-dismissed) notifications for the logged-in user.
// These are meant to sit on the dashboard until the user clicks the cross (×).
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.userId,
      isRead: false,
    }).sort({ createdAt: -1 });

    res.json({ notifications, count: notifications.length });
  } catch (error) {
    console.error("getMyNotifications error:", error.message);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

// PUT /api/notifications/dismiss/:id
// Marks ONE notification as dismissed. This is the only way a notification
// disappears from the dashboard (the user clicking the cross).
export const dismissNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: req.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification dismissed", notification });
  } catch (error) {
    console.error("dismissNotification error:", error.message);
    res.status(500).json({ message: "Error dismissing notification" });
  }
};

// PUT /api/notifications/dismiss-all
// Optional convenience endpoint — dismisses everything for the logged-in user.
export const dismissAllNotifications = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.userId, isRead: false },
      { isRead: true }
    );

    res.json({ message: "All notifications dismissed" });
  } catch (error) {
    console.error("dismissAllNotifications error:", error.message);
    res.status(500).json({ message: "Error dismissing notifications" });
  }
};
