const express = require("express");
const router = express.Router();
const NotificationController = require("../../app/controllers/NotificationController");
const protectCusRoutes = require("../../middleware/protectCustomerRoutes");

router.get(
  "/user",
  protectCusRoutes,
  NotificationController.getUserNotifications
);
router.get("/unread", protectCusRoutes, NotificationController.getUnreadCount);
router.get("/admin/all", NotificationController.getAdminNotifications);
router.get("/admin/unread", NotificationController.getAdminUnreadCount);
router.put(
  "/:notificationId/read",
  protectCusRoutes,
  NotificationController.markAsRead
);
router.delete(
  "/:notificationId",
  protectCusRoutes,
  NotificationController.deleteNotification
);

module.exports = router;
