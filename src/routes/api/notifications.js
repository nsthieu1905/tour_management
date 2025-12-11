const express = require("express");
const router = express.Router();
const NotificationController = require("../../app/controllers/NotificationController");

// Get notifications for a user
router.get("/user/:userId", NotificationController.getUserNotifications);

// Get unread count
router.get("/unread/:userId", NotificationController.getUnreadCount);

// Mark as read
router.put("/:notificationId/read", NotificationController.markAsRead);

// Delete notification
router.delete("/:notificationId", NotificationController.deleteNotification);

// Test notification (development only)
router.post("/test", NotificationController.testNotification);

module.exports = router;
