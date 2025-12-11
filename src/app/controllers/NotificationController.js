const Notification = require("../models/Notification");
const NotificationService = require("../../services/NotificationService");

class NotificationController {
  /**
   * GET /api/notifications/user
   * Get notifications for current user
   */
  async getUserNotifications(req, res) {
    try {
      console.log("📥 [getUserNotifications] Called");
      console.log("   req.user:", req.user);
      console.log("   req.userId:", req.userId);

      const userId = req.user?.userId || req.userId;
      console.log("   userId extracted:", userId);

      if (!userId) {
        console.log("❌ [getUserNotifications] No userId found");
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }
      const limit = req.query.limit || 50;

      console.log(
        "📥 [getUserNotifications] Fetching notifications for:",
        userId,
        "Type:",
        typeof userId,
        userId.toString()
      );
      const notifications = await NotificationService.getNotifications(
        userId,
        limit
      );
      console.log(
        "✅ [getUserNotifications] Found",
        notifications.length,
        "notifications"
      );
      console.log("   First notification (if exists):", notifications[0]);

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      console.error("❌ [getUserNotifications] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/notifications/unread
   * Get unread count for current user
   */
  async getUnreadCount(req, res) {
    try {
      console.log("📥 [getUnreadCount] Called");

      const userId = req.user?.userId || req.userId;
      console.log("   userId extracted:", userId);

      if (!userId) {
        console.log("❌ [getUnreadCount] No userId found");
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }
      const count = await NotificationService.getUnreadCount(userId);
      console.log("✅ [getUnreadCount] Unread count:", count);

      res.json({
        success: true,
        unreadCount: count,
      });
    } catch (error) {
      console.error("❌ [getUnreadCount] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/notifications/:notificationId/read
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user?.userId || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const notification = await NotificationService.markAsRead(
        notificationId,
        userId
      );

      res.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/notifications/:notificationId
   * Delete a notification
   */
  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user?.userId || req.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      await NotificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: "Notification deleted",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/notifications/admin/all
   * Get all admin notifications
   */
  async getAdminNotifications(req, res) {
    try {
      const limit = req.query.limit || 50;

      const notifications = await Notification.find({
        recipientType: "admin",
      })
        .sort({ createdAt: -1 })
        .limit(limit);

      res.json({
        success: true,
        data: notifications,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/notifications/admin/unread
   * Get unread count for admin
   */
  async getAdminUnreadCount(req, res) {
    try {
      const count = await Notification.countDocuments({
        recipientType: "admin",
        read: false,
      });

      res.json({
        success: true,
        unreadCount: count,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * POST /api/notifications/test
   * Test notification (for development only)
   */
  async testNotification(req, res) {
    try {
      const { userId, type, title, message, recipientType } = req.body;

      const notification = await NotificationService.createNotification(
        {
          userId,
          type: type || "system",
          title: title || "Test Notification",
          message: message || "This is a test notification",
          icon: "fa-bell",
          priority: "medium",
        },
        recipientType || "client"
      );

      res.json({
        success: true,
        message: "Test notification sent",
        data: notification,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * GET /api/notifications/test-api
   * Test if API is accessible (no auth required)
   */
  async testApi(req, res) {
    console.log("✅ [testApi] API is working!");
    res.json({
      success: true,
      message: "API is working",
      timestamp: new Date(),
    });
  }
}

module.exports = new NotificationController();
