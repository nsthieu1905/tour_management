const { Notification } = require("../models/index");
const NotificationService = require("../../services/NotificationService");

// [GET] /api/notifications
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const limit = req.query.limit || 50;
    const notifications = await NotificationService.getNotifications(
      userId,
      limit
    );

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.userId || req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }
    const count = await NotificationService.getUnreadCount(userId);

    return res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [POST] /api/notifications/:notificationId/mark-as-read
const markAsRead = async (req, res) => {
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

    return res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [DELETE] /api/notifications/:notificationId
const deleteNotification = async (req, res) => {
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

    return res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /api/notifications/admin
const getAdminNotifications = async (req, res) => {
  try {
    const limit = req.query.limit || 50;

    const notifications = await Notification.find({
      recipientType: "admin",
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /api/notifications/admin/unread-count
const getAdminUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipientType: "admin",
      read: false,
    });

    return res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  deleteNotification,
  getAdminNotifications,
  getAdminUnreadCount,
};
