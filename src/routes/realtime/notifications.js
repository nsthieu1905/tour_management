const express = require("express");
const router = express.Router();
const NotificationController = require("../../app/controllers/NotificationController");
const protectClientRoutes = require("../../middleware/protectClientRoutes");

router.get(
  "/user",
  protectClientRoutes,
  NotificationController.getUserNotifications
);
router.get(
  "/unread",
  protectClientRoutes,
  NotificationController.getUnreadCount
);
router.get("/admin/all", NotificationController.getAdminNotifications);
router.get("/admin/unread", NotificationController.getAdminUnreadCount);
router.put(
  "/:notificationId/read",
  protectClientRoutes,
  NotificationController.markAsRead
);
router.delete(
  "/:notificationId",
  protectClientRoutes,
  NotificationController.deleteNotification
);

module.exports = router;
