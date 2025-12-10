const { Booking, Tour, User, Khuyen_mai } = require("../models/index");
const MoMoService = require("../../services/MoMoService");
const RefundService = require("../../services/RefundService");
const EmailService = require("../../services/EmailService");
const { PAYMENT_LIMITS } = require("../../services/MoMoService");

// [POST] /api/bookings/create-momo-payment
const createMoMoPayment = async (req, res) => {
  try {
    const {
      tourId,
      customerName,
      customerEmail,
      customerPhone,
      guestCount,
      departureDate,
      paymentMethod,
      couponCode,
      subtotal,
      total,
    } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (
      !tourId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !guestCount ||
      !departureDate ||
      !total
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    // Find tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    // Validate total amount (MoMo limits)
    const totalAmount = Math.round(total);
    if (totalAmount < PAYMENT_LIMITS.MIN_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Số tiền thanh toán phải tối thiểu ${PAYMENT_LIMITS.MIN_AMOUNT.toLocaleString(
          "vi-VN"
        )} VND`,
      });
    }
    if (totalAmount > PAYMENT_LIMITS.MAX_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Số tiền thanh toán không được vượt quá ${PAYMENT_LIMITS.MAX_AMOUNT.toLocaleString(
          "vi-VN"
        )} VND`,
      });
    }

    // Generate unique booking code
    const bookingCode = "BK" + new Date().getTime();

    // Parse and validate departureDate
    let departureDateObj = null;
    if (departureDate) {
      departureDateObj = new Date(departureDate);
      if (isNaN(departureDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Ngày khởi hành không hợp lệ",
        });
      }
    }

    // Handle coupon code
    let couponId = null;
    if (couponCode) {
      const coupon = await Khuyen_mai.findOne({
        code: couponCode.toUpperCase(),
      });
      if (coupon) {
        couponId = coupon._id;
      }
    }

    // Create pre-booking (auto expires after 5 minutes)
    const bookingData = {
      bookingCode,
      tourId,
      userId,
      contactInfo: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      numberOfPeople: guestCount,
      totalAmount: total,
      departureDate: departureDateObj,
      paymentMethod: paymentMethod || "momo",
      bookingStatus: "pre_booking",
      paymentStatus: "pending",
    };

    if (couponId) {
      bookingData.couponId = couponId;
    }

    const booking = new Booking(bookingData);
    await booking.save();

    // Create MoMo payment request
    const paymentData = {
      bookingId: booking._id.toString(),
      tourName: tour.name,
      customerName,
      amount: Math.round(total),
    };

    const momoResponse = await MoMoService.createPaymentRequest(paymentData);

    if (momoResponse.payUrl) {
      return res.status(200).json({
        success: true,
        message: "Tạo yêu cầu thanh toán thành công",
        data: {
          bookingId: booking._id,
          bookingCode,
          payUrl: momoResponse.payUrl,
          requestId: momoResponse.requestId,
        },
      });
    } else {
      // Delete pre-booking if payment request fails
      await Booking.findByIdAndDelete(booking._id);

      return res.status(400).json({
        success: false,
        message: "Không thể tạo yêu cầu thanh toán. Vui lòng thử lại",
      });
    }
  } catch (error) {
    console.error("Create MoMo payment error:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      tourId: req.body?.tourId,
    });
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [POST] /api/bookings/create-bank-payment
const createBankPayment = async (req, res) => {
  try {
    const {
      tourId,
      customerName,
      customerEmail,
      customerPhone,
      guestCount,
      departureDate,
      couponCode,
      subtotal,
      total,
      paymentMethod,
    } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (
      !tourId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !guestCount ||
      !departureDate ||
      !total
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    // Find tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    // Parse and validate departureDate
    let departureDateObj = null;
    if (departureDate) {
      departureDateObj = new Date(departureDate);
      if (isNaN(departureDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Ngày khởi hành không hợp lệ",
        });
      }
    }

    // Handle coupon code
    let couponId = null;
    if (couponCode) {
      const coupon = await Khuyen_mai.findOne({
        code: couponCode.toUpperCase(),
      });
      if (coupon) {
        couponId = coupon._id;
      }
    }

    // Generate unique booking code
    const bookingCode = "BK" + new Date().getTime();

    // Create booking data
    const bookingData = {
      bookingCode,
      tourId,
      userId,
      contactInfo: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      numberOfPeople: guestCount,
      totalAmount: total,
      departureDate: departureDateObj,
      paymentMethod: paymentMethod || "bank_transfer",
      paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
      bookingStatus: "pending",
    };

    if (couponId) {
      bookingData.couponId = couponId;
    }

    const booking = new Booking(bookingData);
    await booking.save();

    return res.status(200).json({
      success: true,
      message:
        "Tạo đơn đặt tour thành công. Vui lòng chuyển khoản để xác nhận.",
      data: {
        bookingId: booking._id,
        bookingCode,
      },
    });
  } catch (error) {
    console.error("Create bank payment error:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?.userId,
      tourId: req.body?.tourId,
    });
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [POST] /api/bookings/momo-callback
const momoCallback = async (req, res) => {
  try {
    const {
      requestId,
      orderId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      extraData,
    } = req.body;

    if (resultCode === 0) {
      // Payment successful

      if (extraData) {
        const booking = await Booking.findById(extraData);

        if (booking) {
          booking.bookingStatus = "pending";
          booking.paymentStatus = "paid";
          booking.payments.push({
            amount,
            method: "momo",
            transactionId: transId,
            status: "success",
            paidAt: new Date(),
          });

          await booking.save();
        } else {
          console.error("MoMo callback - Booking not found:", extraData);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Thanh toán thành công",
      });
    } else {
      // Payment failed - Keep pre_booking, will auto-expire
      if (extraData) {
        const booking = await Booking.findById(extraData);
        if (booking) {
          booking.payments.push({
            amount,
            method: "momo",
            transactionId: transId,
            status: "failed",
            paidAt: new Date(),
          });

          await booking.save();
        }
      }

      return res.status(400).json({
        success: false,
        message: `Thanh toán thất bại: ${message}`,
        resultCode,
      });
    }
  } catch (error) {
    console.error("MoMo callback error:", {
      message: error.message,
      stack: error.stack,
      requestId: req.body?.requestId,
      extraData: req.body?.extraData,
    });
    return res.status(500).json({
      success: false,
      message: "Lỗi xử lý callback",
    });
  }
};

// [GET] /api/bookings/:bookingId
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("tourId")
      .populate("couponId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đặt tour",
      });
    }

    // Calculate discount amount if coupon exists
    let discountAmount = 0;
    if (booking.couponId) {
      const coupon = booking.couponId;
      const subtotal = booking.tourId.price * booking.numberOfPeople;

      if (coupon.type === "percentage") {
        discountAmount = Math.floor(subtotal * (coupon.value / 100));
        if (coupon.maxDiscount) {
          discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
      } else if (coupon.type === "fixed_amount") {
        discountAmount = coupon.value;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        ...booking.toObject(),
        discountAmount,
        subtotal: booking.tourId.price * booking.numberOfPeople,
      },
    });
  } catch (error) {
    console.error("Get booking error:", {
      message: error.message,
      stack: error.stack,
      bookingId: req.params?.bookingId,
    });
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// [GET] /api/bookings/user/bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const bookings = await Booking.find({ userId })
      .populate("tourId", "name slug price")
      .select("-payments")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get user bookings error:", {
      message: error.message,
      stack: error.stack,
      userId: req.user?.userId,
    });
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// [GET] /api/bookings/admin/all
const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "";
    const paymentStatus = req.query.paymentStatus || "";
    const search = req.query.search || "";

    // Build filter
    const filter = {};

    if (status === "pre_pending") {
      // Tab "Chờ thanh toán": pending/pending
      filter.bookingStatus = "pending";
      filter.paymentStatus = "pending";
    } else if (status === "pending") {
      // Tab "Chờ xác nhận": paid/pending
      filter.bookingStatus = "pending";
      filter.paymentStatus = "paid";
    } else if (status === "refunded_cancelled") {
      // Tab "Hoàn/Hủy": refunded HOẶC cancelled
      filter.bookingStatus = { $in: ["refunded", "cancelled"] };
    } else {
      // Các tab khác: lọc bình thường
      if (status) filter.bookingStatus = status;
      if (paymentStatus) filter.paymentStatus = paymentStatus;
    }

    if (search) {
      filter.$or = [
        { bookingCode: { $regex: search, $options: "i" } },
        { "contactInfo.name": { $regex: search, $options: "i" } },
      ];
    }

    // Count total
    const total = await Booking.countDocuments(filter);

    // Get paginated bookings
    const bookings = await Booking.find(filter)
      .populate("tourId", "name slug")
      .populate("userId", "fullName email")
      .populate("couponId", "code discountPercentage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/confirm-payment - Xác nhận thanh toán tại quầy
const confirmPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const adminId = req.user.userId;

    const booking = await Booking.findById(bookingId).populate("tourId");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    booking.bookingStatus = "confirmed";
    booking.paymentStatus = "paid";
    booking.payments.push({
      amount: booking.totalAmount,
      method: "cash",
      status: "paid",
      paidAt: new Date(),
    });
    booking.confirmedBy = adminId;
    booking.confirmedAt = new Date();
    await booking.save();

    // Gửi email xác nhận thanh toán + xác nhận đơn (MOCK)
    await EmailService.sendPaymentConfirmationEmail(booking, booking.tourId);
    await EmailService.sendBookingConfirmationEmail(booking, booking.tourId);

    return res.status(200).json({
      success: true,
      message: "Xác nhận thanh toán và đơn đặt tour thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xác nhận thanh toán",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/confirm-booking - Xác nhận đơn đặt tour
const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const adminId = req.user.userId;

    const booking = await Booking.findById(bookingId).populate("tourId");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    // Chỉ có thể xác nhận đơn có trạng thái chờ xác nhận (paid/pending)
    if (booking.bookingStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Trạng thái đơn không hợp lệ để xác nhận",
      });
    }

    booking.bookingStatus = "confirmed";
    // paymentStatus giữ nguyên "paid" (đã thanh toán rồi)
    booking.confirmedBy = adminId;
    booking.confirmedAt = new Date();
    await booking.save();

    // Gửi email xác nhận (MOCK)
    await EmailService.sendBookingConfirmationEmail(booking, booking.tourId);

    return res.status(200).json({
      success: true,
      message: "Xác nhận đơn đặt tour thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Confirm booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xác nhận đơn đặt tour",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/complete - Hoàn thành tour
const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("tourId");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    // Chỉ có thể hoàn thành đơn có trạng thái đã xác nhận
    if (booking.bookingStatus !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hoàn thành các đơn đã xác nhận",
      });
    }

    booking.bookingStatus = "completed";
    await booking.save();

    // Gửi email cảm ơn (MOCK)
    await EmailService.sendCompletionThankYouEmail(booking, booking.tourId);

    return res.status(200).json({
      success: true,
      message: "Hoàn thành tour thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Complete booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi hoàn thành tour",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/request-refund - Yêu cầu hoàn tiền từ phía khách
const requestRefund = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;

    const booking = await Booking.findById(bookingId).populate("tourId");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    // Validate yêu cầu
    const validation = RefundService.validateRefundRequest(booking);
    if (!validation.valid) {
      return res
        .status(400)
        .json({ success: false, message: validation.error });
    }

    // Tính % hoàn tiền tự động
    const refundCalc = RefundService.calculateRefundPercentage(
      booking.departureDate
    );

    // Cập nhật trạng thái
    booking.bookingStatus = "refund_requested";
    booking.refundInfo = {
      reason,
      requestedAt: new Date(),
      daysUntilDeparture: refundCalc.daysUntilDeparture,
      refundPercentage: refundCalc.percentage, // Suggestion
    };
    await booking.save();

    // Gửi email yêu cầu hoàn tiền được chấp nhận
    await EmailService.sendRefundRequestApprovedEmail(booking);

    return res.status(200).json({
      success: true,
      message: "Yêu cầu hoàn tiền đã được ghi nhận",
      data: booking,
      refundSuggestion: refundCalc,
    });
  } catch (error) {
    console.error("Request refund error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi yêu cầu hoàn tiền",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/approve-refund - Xác nhận hoàn tiền
const approveRefund = async (req, res) => {
  try {
    const { bookingId, refundAmount, cancellationFeePercent } = req.body;
    const adminId = req.user.userId;

    if (
      !bookingId ||
      refundAmount === undefined ||
      cancellationFeePercent === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin: bookingId, refundAmount, cancellationFeePercent",
      });
    }

    const booking = await Booking.findById(bookingId).populate("tourId");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    if (booking.bookingStatus !== "refund_requested") {
      return res.status(400).json({
        success: false,
        message: "Đơn này không phải là yêu cầu hoàn tiền",
      });
    }

    const parsedRefundAmount = Number(refundAmount);
    const parsedCancellationFeePercent = Number(cancellationFeePercent);

    if (isNaN(parsedRefundAmount) || isNaN(parsedCancellationFeePercent)) {
      return res.status(400).json({
        success: false,
        message:
          "Dữ liệu không hợp lệ: refundAmount hoặc cancellationFeePercent không phải là số",
      });
    }

    if (
      parsedRefundAmount < 0 ||
      parsedCancellationFeePercent < 0 ||
      parsedCancellationFeePercent > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Dữ liệu không hợp lệ: refundAmount phải >= 0, cancellationFeePercent phải từ 0-100",
      });
    }

    booking.bookingStatus = "refunded";
    booking.refundInfo = booking.refundInfo || {};
    booking.refundInfo.refundAmount = parsedRefundAmount;
    booking.refundInfo.cancellationFeePercent = parsedCancellationFeePercent;
    booking.refundInfo.cancellationFee =
      booking.totalAmount - parsedRefundAmount;
    booking.refundInfo.approvedBy = adminId;
    booking.refundInfo.approvedAt = new Date();
    booking.paymentStatus = "refunded";
    await booking.save();

    // Gửi email hoàn tiền được duyệt (MOCK)
    await EmailService.sendRefundApprovedEmail(booking, parsedRefundAmount);

    return res.status(200).json({
      success: true,
      message: "Xác nhận hoàn tiền thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Approve refund error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xác nhận hoàn tiền",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/reject-refund - Từ chối hoàn tiền
const rejectRefund = async (req, res) => {
  try {
    const { bookingId, rejectionReason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    if (booking.bookingStatus !== "refund_requested") {
      return res.status(400).json({
        success: false,
        message: "Đơn này không phải là yêu cầu hoàn tiền",
      });
    }

    // Cập nhật thông tin từ chối
    booking.refundInfo.rejectionReason = rejectionReason;
    booking.bookingStatus = "confirmed"; // Quay lại trạng thái confirmed
    await booking.save();

    // Gửi email từ chối hoàn tiền (MOCK)
    await EmailService.sendRefundRejectedEmail(booking, rejectionReason);

    return res.status(200).json({
      success: true,
      message: "Từ chối hoàn tiền thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Reject refund error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi từ chối hoàn tiền",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/cancel - Hủy đơn đặt tour
const cancelBooking = async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const adminId = req.user.userId;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    // Cập nhật trạng thái hủy
    booking.bookingStatus = "cancelled";
    booking.cancellationReason = reason;
    booking.cancelledBy = adminId;
    booking.cancelledAt = new Date();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Hủy đơn đặt tour thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi hủy đơn đặt tour",
      error: error.message,
    });
  }
};

module.exports = {
  createMoMoPayment,
  createBankPayment,
  momoCallback,
  getBooking,
  getUserBookings,
  getAllBookings,
  confirmPayment,
  confirmBooking,
  completeBooking,
  requestRefund,
  approveRefund,
  rejectRefund,
  cancelBooking,
};
