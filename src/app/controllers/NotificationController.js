const Notification = require("../models/Notification");
const NotificationService = require("../../services/NotificationService");

class NotificationController {
  /**
   * GET /api/notifications/user/:userId
   * Get notifications for a user
   */
  async getUserNotifications(req, res) {
    try {
      const { userId } = req.params;
      const limit = req.query.limit || 50;

      const notifications = await NotificationService.getNotifications(
        userId,
        limit
      );

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
   * GET /api/notifications/unread/:userId
   * Get unread count for a user
   */
  async getUnreadCount(req, res) {
    try {
      const { userId } = req.params;
      const count = await NotificationService.getUnreadCount(userId);

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
   * PUT /api/notifications/:notificationId/read
   * Mark notification as read
   */
  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const { userId } = req.body;

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
      const { userId } = req.body;

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
}

module.exports = new NotificationController();
