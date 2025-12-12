/**
 * Helper file for sending notifications from controllers
 */

const NotificationService = require("../services/NotificationService");

/**
 * Emit booking notification - CHO CẢ ADMIN VÀ CLIENT
 */
const notifyNewBooking = async (bookingData) => {
  try {
    console.log("🔔 [notifyNewBooking] Sending notifications...");

    // 1. Notify ADMIN about new booking
    await NotificationService.createNotification(
      {
        type: "booking",
        title: "Đơn booking mới",
        message: `${bookingData.userName || "Khách hàng"} đã đặt ${
          bookingData.tourName
        } - Mã đơn: ${bookingData.bookingCode || "N/A"}`,
        icon: "fa-calendar",
        iconBg: "bg-blue-100",
        link: `/admin/booking/${bookingData.bookingId}`,
        data: {
          bookingId: bookingData.bookingId,
          tourId: bookingData.tourId,
        },
        priority: "high",
      },
      "admin"
    );
    console.log("✅ [notifyNewBooking] Admin notification sent");

    // 2. Notify CLIENT about successful booking
    if (bookingData.userId) {
      await NotificationService.createNotification(
        {
          userId: bookingData.userId,
          type: "booking",
          title: "Đặt tour thành công",
          message: `Đặt thành công tour ${bookingData.tourName}. Chúng tôi sẽ sớm liên hệ với bạn.`,
          icon: "fa-check-circle",
          iconBg: "bg-blue-100",
          link: `/booking/${bookingData.bookingId}`,
          data: { bookingId: bookingData.bookingId },
          priority: "high",
        },
        "client"
      );
      console.log("✅ [notifyNewBooking] Client notification sent");
    }
  } catch (error) {
    console.error("❌ [notifyNewBooking] Error:", error.message);
  }
};

/**
 * Emit payment notification - CHỈ DÙNG CHO TRƯỜNG HỢP ĐẶC BIỆT
 * (Không dùng cho flow booking thông thường nữa)
 */
const notifyPayment = async (paymentData) => {
  try {
    console.log("🔔 [notifyPayment] Called with data:", paymentData);

    // Notify admin about payment
    await NotificationService.createNotification(
      {
        type: "payment",
        title: "Đơn booking mới",
        message: `${paymentData.customerName || "Khách hàng"} đã đặt ${
          paymentData.tourName
        } - Mã đơn: ${paymentData.bookingCode || "N/A"}`,
        icon: "fa-calendar",
        iconBg: "bg-blue-100",
        link: `/admin/payment/${paymentData.paymentId}`,
        data: {
          paymentId: paymentData.paymentId,
          bookingId: paymentData.bookingId,
        },
        priority: "high",
      },
      "admin"
    );
    console.log("✅ [notifyPayment] Admin notification sent");

    // Notify client about payment confirmation
    if (paymentData.userId) {
      console.log(
        "📤 [notifyPayment] Sending notification to userId:",
        paymentData.userId
      );
      await NotificationService.createNotification(
        {
          userId: paymentData.userId,
          type: "payment",
          title: "Đặt tour thành công",
          message: `Đặt thành công tour ${paymentData.tourName}. Chúng tôi sẽ sớm liên hệ với bạn.`,
          icon: "fa-check-circle",
          iconBg: "bg-blue-100",
          link: `/booking/${paymentData.bookingId}`,
          data: { paymentId: paymentData.paymentId },
          priority: "high",
        },
        "client"
      );
      console.log("✅ [notifyPayment] Client notification sent");
    } else {
      console.warn(
        "⚠️ [notifyPayment] No userId provided, skipping client notification",
        paymentData
      );
    }
  } catch (error) {
    console.error("❌ [notifyPayment] Error:", error.message);
  }
};

/**
 * Emit refund notification
 */
const notifyRefund = async (refundData) => {
  try {
    // Notify admin
    await NotificationService.createNotification(
      {
        type: "payment",
        title: "Yêu cầu hoàn tiền mới",
        message: `Hoàn tiền từ khách hàng: ${
          refundData.customerName || "N/A"
        } - Số tiền: ${refundData.amount.toLocaleString()} VND`,
        icon: "fa-undo",
        link: `/admin/refund/${refundData.refundId}`,
        data: { refundId: refundData.refundId },
        priority: "high",
      },
      "admin"
    );

    // Notify client about refund status
    if (refundData.userId) {
      await NotificationService.createNotification(
        {
          userId: refundData.userId,
          type: "payment",
          title: "Hoàn tiền đang xử lý",
          message: `Yêu cầu hoàn tiền ${refundData.amount.toLocaleString()} VND sẽ được xử lý trong 3-5 ngày`,
          icon: "fa-undo",
          link: `/booking/${refundData.bookingId}`,
          data: { refundId: refundData.refundId },
          priority: "medium",
        },
        "client"
      );
    }
  } catch (error) {
    console.error("Error sending refund notification:", error);
  }
};

/**
 * Emit tour update notification
 */
const notifyTourUpdate = async (tourData) => {
  try {
    await NotificationService.broadcastToAllClients({
      type: "tour_update",
      title: `Tour mới: ${tourData.name}`,
      message: tourData.description || "Khám phá điểm đến tuyệt vời mới",
      icon: "fa-map",
      link: `/tour/${tourData.tourId}`,
      data: { tourId: tourData.tourId },
      priority: "medium",
    });
  } catch (error) {
    console.error("Error sending tour notification:", error);
  }
};

/**
 * Emit promotion notification
 */
const notifyPromotion = async (promotionData) => {
  try {
    await NotificationService.broadcastToAllClients({
      type: "promotion",
      title: promotionData.title,
      message: promotionData.description,
      icon: "fa-tag",
      link: promotionData.link,
      data: { promotionId: promotionData.promotionId },
      priority: "high",
    });
  } catch (error) {
    console.error("Error sending promotion notification:", error);
  }
};

/**
 * Notify admin about tour running out of spots
 */
const notifyTourAlmostFull = async (tourData) => {
  try {
    await NotificationService.createNotification(
      {
        type: "alert",
        title: `⚠️ Tour sắp hết chỗ: ${tourData.tourName}`,
        message: `Chỉ còn ${tourData.remainingSpots} chỗ. Hãy liên hệ khách hàng chờ đợi`,
        icon: "fa-exclamation-triangle",
        link: `/admin/tour/${tourData.tourId}`,
        data: { tourId: tourData.tourId },
        priority: "urgent",
      },
      "admin"
    );
  } catch (error) {
    console.error("Error sending tour alert notification:", error);
  }
};

/**
 * Notify customer about tour cancellation
 */
const notifyTourCancelled = async (tourData) => {
  try {
    await NotificationService.broadcastToAllClients({
      type: "alert",
      title: `Tour bị hủy: ${tourData.tourName}`,
      message: `Tour ${tourData.tourName} (${tourData.startDate}) đã bị hủy. Vui lòng liên hệ để hoàn tiền.`,
      icon: "fa-ban",
      link: `/`,
      data: { tourId: tourData.tourId },
      priority: "urgent",
    });
  } catch (error) {
    console.error("Error sending tour cancellation notification:", error);
  }
};

/**
 * Notify client when booking is paid/confirmed by admin (thao tác thanh toán)
 */
const notifyBookingPaid = async (bookingData) => {
  try {
    console.log("🔔 [notifyBookingPaid] Called with data:", bookingData);
    if (bookingData.userId) {
      console.log(
        "📤 [notifyBookingPaid] Sending notification to userId:",
        bookingData.userId
      );
      // Gửi notification đặt tour thành công cho client
      await NotificationService.createNotification(
        {
          userId: bookingData.userId,
          type: "booking",
          title: "Đặt tour thành công",
          message: `Đặt thành công tour ${bookingData.tourName}. Chúng tôi sẽ sớm liên hệ với bạn.`,
          icon: "fa-check-circle",
          iconBg: "bg-blue-100",
          link: `/booking/${bookingData.bookingId}`,
          data: { bookingId: bookingData.bookingId },
          priority: "high",
        },
        "client"
      );
      console.log("✅ [notifyBookingPaid] Notification sent successfully");
    } else {
      console.warn(
        "⚠️ [notifyBookingPaid] No userId provided, skipping notification",
        bookingData
      );
    }
  } catch (error) {
    console.error(
      "❌ [notifyBookingPaid] Error sending booking paid notification:",
      error.message
    );
  }
};

/**
 * Notify client when booking is confirmed by admin (xác nhận) - chỉ email, không notification
 */
const notifyBookingConfirmed = async (bookingData) => {
  // Chỉ gửi email, không gửi notification
  // Email được gửi từ EmailService trong controller
  console.log("📧 [notifyBookingConfirmed] Email sẽ được gửi từ EmailService");
};

/**
 * Notify client when refund is requested by admin (yêu cầu hoàn tiền)
 * ADMIN THAO TÁC -> GỬI CHO CLIENT + ADMIN
 */
const notifyRefundRequested = async (refundData) => {
  try {
    console.log("🔔 [notifyRefundRequested] Called with data:", refundData);

    // 1. Notify ADMIN about refund request
    await NotificationService.createNotification(
      {
        type: "refund",
        title: "Yêu cầu hoàn tiền mới",
        message: `Khách hàng yêu cầu hoàn tiền cho tour ${
          refundData.tourName
        } - Mã đơn: ${refundData.bookingCode || "N/A"}`,
        icon: "fa-undo",
        iconBg: "bg-blue-100",
        link: `/admin/booking/${refundData.bookingId}`,
        data: { bookingId: refundData.bookingId },
        priority: "high",
      },
      "admin"
    );
    console.log("✅ [notifyRefundRequested] Admin notification sent");

    // 2. Notify CLIENT
    if (refundData.userId) {
      console.log(
        "📤 [notifyRefundRequested] Sending notification to userId:",
        refundData.userId
      );
      await NotificationService.createNotification(
        {
          userId: refundData.userId,
          type: "refund",
          title: "Yêu cầu hoàn tiền",
          message:
            "Yêu cầu hoàn tiền của bạn đã được chấp nhận. Chúng tôi sẽ sớm liên hệ lại với bạn.",
          icon: "fa-undo",
          iconBg: "bg-blue-100",
          link: `/booking/${refundData.bookingId}`,
          data: { bookingId: refundData.bookingId },
          priority: "high",
        },
        "client"
      );
      console.log("✅ [notifyRefundRequested] Client notification sent");
    } else {
      console.warn(
        "⚠️ [notifyRefundRequested] No userId provided, skipping client notification",
        refundData
      );
    }
  } catch (error) {
    console.error("❌ [notifyRefundRequested] Error:", error.message);
  }
};

/**
 * Notify client when refund is confirmed by admin (xác nhận hoàn tiền)
 * ADMIN THAO TÁC -> GỬI CHO CLIENT + ADMIN
 */
const notifyRefundConfirmed = async (refundData) => {
  try {
    console.log("🔔 [notifyRefundConfirmed] Called with data:", refundData);

    // 1. Notify ADMIN about refund approval
    await NotificationService.createNotification(
      {
        type: "refund",
        title: "Hoàn tiền đã xác nhận",
        message: `Đã xác nhận hoàn tiền cho tour ${
          refundData.tourName
        } - Mã đơn: ${refundData.bookingCode || "N/A"}`,
        icon: "fa-check-circle",
        iconBg: "bg-blue-100",
        link: `/admin/booking/${refundData.bookingId}`,
        data: { bookingId: refundData.bookingId },
        priority: "high",
      },
      "admin"
    );
    console.log("✅ [notifyRefundConfirmed] Admin notification sent");

    // 2. Notify CLIENT
    if (refundData.userId) {
      console.log(
        "📤 [notifyRefundConfirmed] Sending notification to userId:",
        refundData.userId
      );
      await NotificationService.createNotification(
        {
          userId: refundData.userId,
          type: "refund",
          title: "Hoàn tiền thành công",
          message:
            "Hoàn tiền thành công. Trong thời gian 3 - 5 ngày nếu chưa nhận được tiền vui lòng liên hệ lại với chúng tôi để được giải quyết.",
          icon: "fa-check-circle",
          iconBg: "bg-blue-100",
          link: `/booking/${refundData.bookingId}`,
          data: { bookingId: refundData.bookingId },
          priority: "high",
        },
        "client"
      );
      console.log("✅ [notifyRefundConfirmed] Client notification sent");
    } else {
      console.warn(
        "⚠️ [notifyRefundConfirmed] No userId provided, skipping client notification",
        refundData
      );
    }
  } catch (error) {
    console.error("❌ [notifyRefundConfirmed] Error:", error.message);
  }
};

/**
 * Notify client when booking is cancelled by admin
 * ADMIN THAO TÁC -> GỬI CHO CLIENT + ADMIN
 */
const notifyCancellation = async (cancellationData) => {
  try {
    console.log("🔔 [notifyCancellation] Called with data:", cancellationData);

    // 1. Notify ADMIN about cancellation
    await NotificationService.createNotification(
      {
        type: "booking",
        title: "Đơn tour đã bị hủy",
        message: `Đã hủy đơn tour ${cancellationData.tourName} - Mã đơn: ${
          cancellationData.bookingCode || "N/A"
        }. Lý do: ${
          cancellationData.cancellationReason || "Không có lý do được cung cấp"
        }`,
        icon: "fa-times-circle",
        iconBg: "bg-blue-100",
        link: `/admin/booking/${cancellationData.bookingId}`,
        data: { bookingId: cancellationData.bookingId },
        priority: "high",
      },
      "admin"
    );
    console.log("✅ [notifyCancellation] Admin notification sent");

    // 2. Notify CLIENT
    if (cancellationData.userId) {
      console.log(
        "📤 [notifyCancellation] Sending notification to userId:",
        cancellationData.userId
      );
      await NotificationService.createNotification(
        {
          userId: cancellationData.userId,
          type: "booking",
          title: "Đơn tour đã bị hủy",
          message: `Đơn đặt tour ${
            cancellationData.tourName
          } đã bị hủy. Lý do: ${
            cancellationData.cancellationReason ||
            "Không có lý do được cung cấp"
          }`,
          icon: "fa-times-circle",
          iconBg: "bg-blue-100",
          link: `/booking/${cancellationData.bookingId}`,
          data: { bookingId: cancellationData.bookingId },
          priority: "high",
        },
        "client"
      );
      console.log("✅ [notifyCancellation] Client notification sent");
    } else {
      console.warn(
        "⚠️ [notifyCancellation] No userId provided, skipping client notification",
        cancellationData
      );
    }
  } catch (error) {
    console.error("❌ [notifyCancellation] Error:", error.message);
  }
};

/**
 * Notify client when booking is completed
 */
const notifyBookingCompleted = async (bookingData) => {
  try {
    if (bookingData.userId) {
      await NotificationService.createNotification(
        {
          userId: bookingData.userId,
          type: "booking",
          title: "Tour đã hoàn thành",
          message: `Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi cho tour ${bookingData.tourName}. Chúng tôi hy vọng bạn có trải nghiệm tuyệt vời!`,
          icon: "fa-thumbs-up",
          iconBg: "bg-blue-100",
          link: `/booking/${bookingData.bookingId}`,
          data: { bookingId: bookingData.bookingId },
          priority: "medium",
        },
        "client"
      );
    }
  } catch (error) {
    console.error("Error sending booking completed notification:", error);
  }
};

module.exports = {
  notifyNewBooking,
  notifyPayment,
  notifyBookingPaid,
  notifyRefundRequested,
  notifyRefundConfirmed,
  notifyCancellation,
  notifyBookingCompleted,
  notifyTourUpdate,
  notifyPromotion,
};
