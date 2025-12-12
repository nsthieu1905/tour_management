const express = require("express");
const router = express.Router();
const NotificationController = require("../../app/controllers/NotificationController");
const protectClientRoutes = require("../../middleware/protectClientRoutes");

// Get notifications for current user (protected)
router.get(
  "/user",
  protectClientRoutes,
  NotificationController.getUserNotifications
);

// Get unread count for current user (protected)
router.get(
  "/unread",
  protectClientRoutes,
  NotificationController.getUnreadCount
);

// Get all admin notifications
router.get("/admin/all", NotificationController.getAdminNotifications);

// Get unread count for admin
router.get("/admin/unread", NotificationController.getAdminUnreadCount);

// Mark as read (protected)
router.put(
  "/:notificationId/read",
  protectClientRoutes,
  NotificationController.markAsRead
);

// Delete notification (protected)
router.delete(
  "/:notificationId",
  protectClientRoutes,
  NotificationController.deleteNotification
);

// Test notification (development only)
router.post("/test", NotificationController.testNotification);

// Test API endpoint (no auth required)
// router.get("/test-api", NotificationController.testApi);

module.exports = router;
