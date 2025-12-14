const calculateRefundPercentage = (
  departureDate,
  cancellationDate = new Date()
) => {
  // Tính số ngày từ ngày hủy đến ngày khởi hành
  const timeLeft = new Date(departureDate) - new Date(cancellationDate);
  const daysUntilDeparture = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  let percentage = 0;
  let message = "";

  if (daysUntilDeparture >= 31) {
    percentage = 100;
    message = `Hủy trước 31 ngày - Hoàn 90% (${daysUntilDeparture} ngày)`;
  } else if (daysUntilDeparture >= 20) {
    percentage = 80;
    message = `Hủy từ 20-29 ngày - Hoàn 80% (${daysUntilDeparture} ngày)`;
  } else if (daysUntilDeparture >= 15) {
    percentage = 70;
    message = `Hủy từ 15-19 ngày - Hoàn 70% (${daysUntilDeparture} ngày)`;
  } else if (daysUntilDeparture >= 10) {
    percentage = 60;
    message = `Hủy từ 07-14 ngày - Hoàn 60% (${daysUntilDeparture} ngày)`;
  } else if (daysUntilDeparture >= 3) {
    percentage = 25;
    message = `Hủy từ 03-06 ngày - Hoàn 25% (${daysUntilDeparture} ngày)`;
  } else if (daysUntilDeparture > 0) {
    percentage = 10;
    message = `Hủy dưới 03 ngày - Không hoàn tiền (${daysUntilDeparture} ngày)`;
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

const calculateRefundAmount = (totalAmount, percentage) => {
  return Math.round((totalAmount * percentage) / 100);
};

const validateRefundRequest = (booking) => {
  // Chỉ các đơn đã thanh toán mới có thể yêu cầu hoàn tiền
  if (booking.paymentStatus !== "paid") {
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
