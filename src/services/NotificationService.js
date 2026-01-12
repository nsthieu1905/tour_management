const mongoose = require("mongoose");
const Notification = require("../app/models/Notification");

class NotificationService {
  static async createNotification(
    notificationData,
    recipientType = "customer"
  ) {
    try {
      const notification = new Notification({
        userId: notificationData.userId,
        recipientType: recipientType,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        icon: notificationData.icon || "fa-bell",
        iconBg: notificationData.iconBg || "bg-blue-100",
        link: notificationData.link,
        data: notificationData.data,
        priority: notificationData.priority || "medium",
      });

      await notification.save();

      const notificationObj = {
        id: notification._id,
        ...notificationData,
        read: false,
      };

      if (recipientType === "admin") {
        global.io
          .to("admin-notifications")
          .emit("notification:new", notificationObj);
      } else {
        if (notificationData.userId) {
          const userIdStr = notificationData.userId.toString
            ? notificationData.userId.toString()
            : notificationData.userId;
          const roomName = `user:${userIdStr}`;

          global.io.to(roomName).emit("notification:new", notificationObj);
        }
      }
      return notification;
    } catch (error) {
      console.error(
        "[NotificationService] Error creating notification:",
        error
      );
      throw error;
    }
  }

  static async getNotifications(userId, limit = 50) {
    try {
      let queryUserId = userId;
      if (typeof userId === "string") {
        queryUserId = new mongoose.Types.ObjectId(userId);
      }

      // Lấy cả user notifications + promotion notifications
      const query = {
        $or: [{ userId: queryUserId }, { recipientType: "promotion" }],
      };
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      return notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  }

  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );

      global.io.to(`user:${userId}`).emit("notification:read", notificationId);

      return notification;
    } catch (error) {
      console.error(
        "[NotificationService] Error marking notification as read:",
        error
      );
      throw error;
    }
  }

  static async deleteNotification(notificationId, userId) {
    try {
      await Notification.findByIdAndDelete(notificationId);

      global.io
        .to(`user:${userId}`)
        .emit("notification:delete", notificationId);

      return true;
    } catch (error) {
      console.error(
        "[NotificationService] Error deleting notification:",
        error
      );
      throw error;
    }
  }

  static broadcastToAdmin(notification) {
    if (global.io) {
      global.io
        .to("admin-notifications")
        .emit("notification:new", notification);
    }
  }

  static broadcastToAllCustomers(notification) {
    if (global.io) {
      global.io
        .to("customer-notifications")
        .emit("notification:new", notification);
    }
  }

  static broadcastToUser(userId, notification) {
    if (global.io) {
      global.io.to(`user:${userId}`).emit("notification:new", notification);
    }
  }

  static async createAndBroadcastPromotion(notificationData) {
    try {
      // Lưu vào DB (không có userId - broadcast cho tất cả)
      const notification = new Notification({
        recipientType: "promotion",
        type: notificationData.type || "promotion",
        title: notificationData.title,
        message: notificationData.message,
        icon: notificationData.icon || "fa-tag",
        link: notificationData.link || "/",
        data: notificationData.data || {},
        priority: notificationData.priority || "high",
      });
      await notification.save();
      console.log("[NotificationService] Promotion saved:", notification._id);

      // Broadcast qua socket realtime (gồm cả iconBg)
      const broadcastData = {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        icon: notification.icon,
        iconBg: notificationData.iconBg || "bg-blue-100",
        link: notification.link,
        data: notification.data,
        priority: notification.priority,
        read: false,
      };

      if (global.io) {
        global.io
          .to("customer-notifications")
          .emit("notification:new", broadcastData);
        console.log("[NotificationService] Promotion broadcasted to customers");
      } else {
        console.warn("[NotificationService] global.io not available");
      }

      return notification;
    } catch (error) {
      console.error(
        "[NotificationService] Error creating promotion notification:",
        error
      );
      throw error;
    }
  }

  static async getUnreadCount(userId) {
    try {
      let queryUserId = userId;
      if (typeof userId === "string") {
        queryUserId = new mongoose.Types.ObjectId(userId);
      }

      return await Notification.countDocuments({
        read: false,
        $or: [{ userId: queryUserId }, { recipientType: "promotion" }],
      });
    } catch (error) {
      console.error("[NotificationService] Error getting unread count:", error);
      throw error;
    }
  }

  static async notifyBooking(bookingData) {
    const notification = {
      userId: bookingData.userId,
      type: "booking",
      title: "Đơn đặt tour mới",
      message: `Bạn vừa đặt tour ${bookingData.tourName}`,
      icon: "fa-calendar",
      link: `/booking/${bookingData.bookingId}`,
      data: { bookingId: bookingData.bookingId, tourId: bookingData.tourId },
      priority: "high",
    };

    return this.createNotification(notification, "customer");
  }

  static async notifyTourUpdate(tourData) {
    const notification = {
      type: "tour_update",
      title: `Tour mới: ${tourData.tourName}`,
      message: tourData.description,
      icon: "fa-map",
      link: `/tour/${tourData.tourId}`,
      data: { tourId: tourData.tourId },
      priority: "medium",
    };

    return this.broadcastToAllCustomers(notification);
  }

  static async notifyPromotion(promotionData) {
    const notification = {
      type: "promotion",
      title: promotionData.title,
      message: promotionData.description,
      icon: "fa-tag",
      link: promotionData.link,
      data: { promotionId: promotionData.promotionId },
      priority: "high",
    };

    return this.broadcastToAllCustomers(notification);
  }

  static async notifyPayment(paymentData) {
    const notification = {
      userId: paymentData.userId,
      type: "payment",
      title: paymentData.title || "Thanh toán được cập nhật",
      message: paymentData.message,
      icon: "fa-credit-card",
      link: paymentData.link,
      data: { paymentId: paymentData.paymentId },
      priority: "high",
    };

    return this.createNotification(notification, "customer");
  }
}

module.exports = NotificationService;
