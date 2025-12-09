/**
 * Refund Service - Xử lý logic hoàn tiền cho tour
 */

/**
 * Tính toán % hoàn tiền dựa trên ngày hủy
 *
 * Chính sách:
 * - Hủy trước 7 ngày: hoàn 100%
 * - Hủy trước 3 ngày (từ 3-7): hoàn 50%
 * - Hủy trong vòng 3 ngày: không hoàn (0%)
 *
 * @param {Date} departureDate - Ngày khởi hành
 * @param {Date} cancellationDate - Ngày yêu cầu hủy (mặc định: hôm nay)
 * @returns {Object} { percentage: 0|50|100, daysUntilDeparture: number, message: string }
 */
const calculateRefundPercentage = (
  departureDate,
  cancellationDate = new Date()
) => {
  // Tính số ngày từ ngày hủy đến ngày khởi hành
  const timeLeft = new Date(departureDate) - new Date(cancellationDate);
  const daysUntilDeparture = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  let percentage = 0;
  let message = "";

  if (daysUntilDeparture >= 7) {
    percentage = 100;
    message = `Hủy trước 7 ngày - Hoàn 100% (${daysUntilDeparture} ngày)`;
  } else if (daysUntilDeparture >= 3) {
    percentage = 50;
    message = `Hủy từ 3-7 ngày - Hoàn 50% (${daysUntilDeparture} ngày)`;
  } else if (daysUntilDeparture > 0) {
    percentage = 0;
    message = `Hủy trong 3 ngày - Không hoàn tiền (${daysUntilDeparture} ngày)`;
  } else {
    percentage = 0;
    message = `Tour đã khởi hành - Không hoàn tiền`;
  }

  return {
    percentage,
    daysUntilDeparture,
    message,
  };
};

/**
 * Tính số tiền hoàn
 * @param {number} totalAmount - Tổng tiền
 * @param {number} percentage - % hoàn (0-100)
 * @returns {number} Số tiền hoàn
 */
const calculateRefundAmount = (totalAmount, percentage) => {
  return Math.round((totalAmount * percentage) / 100);
};

/**
 * Xác thực yêu cầu hoàn tiền
 * @param {Object} booking - Đối tượng booking
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateRefundRequest = (booking) => {
  // Chỉ các đơn đã xác nhận mới có thể yêu cầu hoàn tiền
  if (booking.bookingStatus !== "confirmed") {
    return {
      valid: false,
      error: "Chỉ các đơn đã xác nhận mới có thể yêu cầu hoàn tiền",
    };
  }

  // Không thể hoàn tiền nếu đã yêu cầu hoàn tiền trước đó
  if (
    booking.bookingStatus === "refund_requested" ||
    booking.bookingStatus === "refunded"
  ) {
    return {
      valid: false,
      error: "Đơn này đã yêu cầu hoặc hoàn tiền rồi",
    };
  }

  // Kiểm tra tour đã khởi hành chưa
  if (new Date(booking.departureDate) < new Date()) {
    return {
      valid: false,
      error: "Tour đã khởi hành, không thể hoàn tiền",
    };
  }

  return { valid: true };
};

module.exports = {
  calculateRefundPercentage,
  calculateRefundAmount,
  validateRefundRequest,
};
