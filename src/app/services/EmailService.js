/**
 * Email Service - Gửi email thông báo
 * Phiên bản MOCK/Demo (chỉ log console, không thực sự gửi email)
 */

/**
 * Gửi email xác nhận đặt tour
 * @param {Object} booking - Đối tượng booking
 * @param {Object} tour - Đối tượng tour
 */
const sendBookingConfirmationEmail = async (booking, tour) => {
  try {
    const emailData = {
      to: booking.contactInfo?.email,
      subject: `🎉 Xác nhận đơn đặt tour - ${booking.bookingCode}`,
      customerName: booking.contactInfo?.name,
      bookingCode: booking.bookingCode,
      tourName: tour?.name,
      departureDate: new Date(booking.departureDate).toLocaleDateString(
        "vi-VN"
      ),
      numberOfPeople: booking.numberOfPeople,
      totalAmount: new Intl.NumberFormat("vi-VN").format(
        Math.round(booking.totalAmount)
      ),
      message: "Cảm ơn bạn đã đặt tour! Chúng tôi sẽ liên hệ với bạn sớm nhất.",
    };

    // MOCK: In ra console thay vì gửi email thật
    console.log("📧 [MOCK EMAIL] - Booking Confirmation");
    console.log(JSON.stringify(emailData, null, 2));

    return { success: true, message: "Email xác nhận đã được gửi (MOCK)" };
  } catch (error) {
    console.error("Send confirmation email error:", error);
    throw error;
  }
};

/**
 * Gửi email hoàn tiền được duyệt
 * @param {Object} booking - Đối tượng booking
 * @param {number} refundAmount - Số tiền hoàn
 */
const sendRefundApprovedEmail = async (booking, refundAmount) => {
  try {
    const emailData = {
      to: booking.contactInfo?.email,
      subject: `✅ Hoàn tiền tour - ${booking.bookingCode}`,
      customerName: booking.contactInfo?.name,
      bookingCode: booking.bookingCode,
      refundAmount: new Intl.NumberFormat("vi-VN").format(
        Math.round(refundAmount)
      ),
      refundPercentage: booking.refundInfo?.refundPercentage,
      reason: booking.refundInfo?.reason,
      message:
        "Hoàn tiền của bạn đã được duyệt. Số tiền sẽ được chuyển trong 3-5 ngày làm việc.",
    };

    // MOCK: In ra console
    console.log("📧 [MOCK EMAIL] - Refund Approved");
    console.log(JSON.stringify(emailData, null, 2));

    return { success: true, message: "Email hoàn tiền đã được gửi (MOCK)" };
  } catch (error) {
    console.error("Send refund approved email error:", error);
    throw error;
  }
};

/**
 * Gửi email hoàn tiền bị từ chối
 * @param {Object} booking - Đối tượng booking
 * @param {string} rejectionReason - Lý do từ chối
 */
const sendRefundRejectedEmail = async (booking, rejectionReason) => {
  try {
    const emailData = {
      to: booking.contactInfo?.email,
      subject: `❌ Yêu cầu hoàn tiền bị từ chối - ${booking.bookingCode}`,
      customerName: booking.contactInfo?.name,
      bookingCode: booking.bookingCode,
      rejectionReason,
      message:
        "Rất tiếc, yêu cầu hoàn tiền của bạn không được chấp nhận. Vui lòng liên hệ với chúng tôi để biết thêm chi tiết.",
    };

    // MOCK: In ra console
    console.log("📧 [MOCK EMAIL] - Refund Rejected");
    console.log(JSON.stringify(emailData, null, 2));

    return {
      success: true,
      message: "Email từ chối hoàn tiền đã được gửi (MOCK)",
    };
  } catch (error) {
    console.error("Send refund rejected email error:", error);
    throw error;
  }
};

/**
 * Gửi email cảm ơn sau khi tour kết thúc
 * @param {Object} booking - Đối tượng booking
 * @param {Object} tour - Đối tượng tour
 */
const sendCompletionThankYouEmail = async (booking, tour) => {
  try {
    const emailData = {
      to: booking.contactInfo?.email,
      subject: `🙏 Cảm ơn bạn đã tham gia tour - ${tour?.name}`,
      customerName: booking.contactInfo?.name,
      tourName: tour?.name,
      departureDate: new Date(booking.departureDate).toLocaleDateString(
        "vi-VN"
      ),
      message:
        "Cảm ơn bạn đã chọn tour du lịch của chúng tôi! Hy vọng bạn đã có những trải nghiệm tuyệt vời. Chúng tôi rất mong được phục vụ bạn lần tiếp theo!",
      surveyLink: "https://example.com/survey", // Link khảo sát
    };

    // MOCK: In ra console
    console.log("📧 [MOCK EMAIL] - Completion Thank You");
    console.log(JSON.stringify(emailData, null, 2));

    return { success: true, message: "Email cảm ơn đã được gửi (MOCK)" };
  } catch (error) {
    console.error("Send completion thank you email error:", error);
    throw error;
  }
};

/**
 * Gửi email xác nhận thanh toán tại quầy
 * @param {Object} booking - Đối tượng booking
 * @param {Object} tour - Đối tượng tour
 */
const sendPaymentConfirmationEmail = async (booking, tour) => {
  try {
    const emailData = {
      to: booking.contactInfo?.email,
      subject: `💳 Xác nhận thanh toán - ${booking.bookingCode}`,
      customerName: booking.contactInfo?.name,
      bookingCode: booking.bookingCode,
      tourName: tour?.name,
      totalAmount: new Intl.NumberFormat("vi-VN").format(
        Math.round(booking.totalAmount)
      ),
      paymentMethod: "Thanh toán tại quầy",
      message:
        "Cảm ơn bạn! Thanh toán của bạn đã được xác nhận. Chúng tôi sẽ xác nhận đơn tour sớm nhất.",
    };

    // MOCK: In ra console
    console.log("📧 [MOCK EMAIL] - Payment Confirmation");
    console.log(JSON.stringify(emailData, null, 2));

    return {
      success: true,
      message: "Email xác nhận thanh toán đã được gửi (MOCK)",
    };
  } catch (error) {
    console.error("Send payment confirmation email error:", error);
    throw error;
  }
};

module.exports = {
  sendBookingConfirmationEmail,
  sendRefundApprovedEmail,
  sendRefundRejectedEmail,
  sendCompletionThankYouEmail,
  sendPaymentConfirmationEmail,
};
