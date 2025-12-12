const mongoose = require("mongoose");
const Notification = require("../app/models/Notification");

class NotificationService {
  /**
   * Create and broadcast a notification
   * @param {Object} notificationData - { userId, type, title, message, icon, link, data, priority, recipientType }
   * @param {string} recipientType - 'admin' or 'client'
   */
  static async createNotification(notificationData, recipientType = "client") {
    try {
      console.log("\n🔔 [NotificationService] Creating notification...");
      console.log("   Type:", notificationData.type);
      console.log("   Title:", notificationData.title);
      console.log("   RecipientType:", recipientType);
      console.log("   UserId:", notificationData.userId);
      console.log("   UserId type:", typeof notificationData.userId);

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
      console.log(
        "✅ [NotificationService] Notification saved to DB:",
        notification._id
      );
      console.log("   Saved userId:", notification.userId);
      console.log("   Saved userId type:", typeof notification.userId);

      // Broadcast to appropriate room
      const notificationObj = {
        id: notification._id,
        ...notificationData,
        read: false,
      };

      console.log("📡 [NotificationService] Broadcasting notification...");
      console.log("   global.io exists?", !!global.io);
      console.log("   notificationData.userId:", notificationData.userId);
      console.log("   userId type:", typeof notificationData.userId);

      if (recipientType === "admin") {
        // Broadcast to all admins
        console.log("📢 Broadcasting to admin-notifications room");
        global.io
          .to("admin-notifications")
          .emit("notification:new", notificationObj);
        console.log("✅ Emitted to admin-notifications");
      } else {
        // Broadcast to specific user ONLY (not to all clients)
        if (notificationData.userId) {
          // Convert ObjectId to string for room name
          const userIdStr = notificationData.userId.toString
            ? notificationData.userId.toString()
            : notificationData.userId;
          const roomName = `user:${userIdStr}`;

          console.log(`📢 Broadcasting to ${roomName} room`);
          console.log(`   Room name:`, roomName);
          console.log(
            `   Total sockets connected:`,
            global.io?.engine?.clientsCount
          );

          global.io.to(roomName).emit("notification:new", notificationObj);
          console.log(`✅ Emitted to ${roomName}`);
        } else {
          console.error("❌ No userId in notificationData for broadcast!");
        }
      }

      console.log("✅ [NotificationService] Notification sent successfully!\n");
      return notification;
    } catch (error) {
      console.error(
        "❌ [NotificationService] Error creating notification:",
        error
      );
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  static async getNotifications(userId, limit = 50) {
    try {
      console.log("📊 [NotificationService.getNotifications] Query params:");
      console.log("   userId:", userId);
      console.log("   userId type:", typeof userId);
      console.log("   userId toString:", userId.toString?.());

      // Convert string userId to ObjectId if needed
      let queryUserId = userId;
      if (typeof userId === "string") {
        queryUserId = new mongoose.Types.ObjectId(userId);
        console.log("   Converted to ObjectId:", queryUserId);
      }

      const query = { userId: queryUserId };
      console.log("   Final query object:", query);

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      console.log("📊 [NotificationService.getNotifications] Result:");
      console.log("   Found:", notifications.length, "notifications");
      if (notifications.length > 0) {
        console.log("   First notification userId:", notifications[0].userId);
        console.log(
          "   First notification userId type:",
          typeof notifications[0].userId
        );
      }

      return notifications;
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );

      // Broadcast the read status update
      global.io.to(`user:${userId}`).emit("notification:read", notificationId);

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId, userId) {
    try {
      await Notification.findByIdAndDelete(notificationId);

      // Broadcast the delete event
      global.io
        .to(`user:${userId}`)
        .emit("notification:delete", notificationId);

      return true;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * Broadcast notification to admin
   */
  static broadcastToAdmin(notification) {
    if (global.io) {
      global.io
        .to("admin-notifications")
        .emit("notification:new", notification);
    }
  }

  /**
   * Broadcast notification to all clients
   */
  static broadcastToAllClients(notification) {
    if (global.io) {
      global.io
        .to("client-notifications")
        .emit("notification:new", notification);
    }
  }

  /**
   * Broadcast notification to specific user
   */
  static broadcastToUser(userId, notification) {
    if (global.io) {
      global.io.to(`user:${userId}`).emit("notification:new", notification);
    }
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId) {
    try {
      return await Notification.countDocuments({ userId, read: false });
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw error;
    }
  }

  /**
   * Create booking notification
   */
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

    return this.createNotification(notification, "client");
  }

  /**
   * Create tour update notification
   */
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

    return this.broadcastToAllClients(notification);
  }

  /**
   * Create promotion notification
   */
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

    return this.broadcastToAllClients(notification);
  }

  /**
   * Create payment notification
   */
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

    return this.createNotification(notification, "client");
  }
}

module.exports = NotificationService;
