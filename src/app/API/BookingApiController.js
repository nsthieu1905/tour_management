const { Booking, Tour, User, Khuyen_mai } = require("../models/index");
const MoMoService = require("../../services/MoMoService");
const RefundService = require("../../services/RefundService");
const EmailService = require("../../services/EmailService");
const {
  notifyNewBooking,
  notifyBookingPaid,
  notifyRefundRequested,
  notifyRefundConfirmed,
  notifyCancellation,
  notifyBookingCompleted,
} = require("../../utils/NotificationHelper");
const { PAYMENT_LIMITS } = require("../../services/MoMoService");

// ==================== HELPER FUNCTIONS ====================
const sendBookingNotification = async (booking, tour, customerName) => {
  try {
    console.log("🔔 [sendBookingNotification] Sending booking notification");
    console.log("   User ID:", booking.userId);
    console.log("   Customer Name:", customerName);
    console.log("   Tour Name:", tour?.name || "N/A");

    await notifyNewBooking({
      userId: booking.userId,
      bookingId: booking._id,
      tourId: booking.tourId,
      bookingCode: booking.bookingCode,
      userName: customerName,
      tourName: tour?.name || "Tour",
      passengers: booking.numberOfPeople,
      paymentDeadline: "27/12",
    });

    console.log("✅ [sendBookingNotification] Notification sent successfully");
  } catch (error) {
    console.error("⚠️ [sendBookingNotification] Error:", error.message);
  }
};

/**
 * Helper: Validate và parse booking data
 */
const validateAndParseBookingData = (body) => {
  const {
    tourId,
    customerName,
    customerEmail,
    customerPhone,
    guestCount,
    departureDate,
    total,
  } = body;

  if (
    !tourId ||
    !customerName ||
    !customerEmail ||
    !customerPhone ||
    !guestCount ||
    !departureDate ||
    !total
  ) {
    throw new Error("Vui lòng điền đầy đủ thông tin");
  }

  // Parse and validate departureDate
  const departureDateObj = new Date(departureDate);
  if (isNaN(departureDateObj.getTime())) {
    throw new Error("Ngày khởi hành không hợp lệ");
  }

  return {
    tourId,
    customerName,
    customerEmail,
    customerPhone,
    guestCount,
    departureDate: departureDateObj,
    total,
  };
};

/**
 * Helper: Tạo booking data object
 */
const createBookingDataObject = async (params) => {
  const {
    userId,
    tourId,
    customerName,
    customerEmail,
    customerPhone,
    guestCount,
    departureDate,
    total,
    couponCode,
    paymentMethod,
    bookingStatus,
    paymentStatus,
  } = params;

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
    departureDate,
    paymentMethod: paymentMethod || "momo",
    bookingStatus: bookingStatus || "pre_booking",
    paymentStatus: paymentStatus || "pending",
  };

  if (couponId) {
    bookingData.couponId = couponId;
  }

  return bookingData;
};

// ==================== API CONTROLLERS ====================

// [POST] /api/bookings/create-momo-payment
const createMoMoPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const validatedData = validateAndParseBookingData(req.body);
    const { tourId, customerName, total, couponCode } = req.body;

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

    // Create pre-booking (auto expires after 5 minutes)
    const bookingData = await createBookingDataObject({
      userId,
      ...validatedData,
      couponCode,
      paymentMethod: "momo",
      bookingStatus: "pre_booking",
      paymentStatus: "pending",
    });

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
          bookingCode: bookingData.bookingCode,
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
      message: error.message || "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [POST] /api/bookings/create-bank-payment
const createBankPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const validatedData = validateAndParseBookingData(req.body);
    const { tourId, customerName, couponCode, paymentMethod } = req.body;

    // Find tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    // Create booking data
    const bookingData = await createBookingDataObject({
      userId,
      ...validatedData,
      couponCode,
      paymentMethod: paymentMethod || "bank_transfer",
      bookingStatus: "pending",
      paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
    });

    const booking = new Booking(bookingData);
    await booking.save();

    // Gửi thông báo booking mới (cho cả admin và client)
    await sendBookingNotification(booking, tour, customerName);

    return res.status(200).json({
      success: true,
      message:
        "Tạo đơn đặt tour thành công. Vui lòng chuyển khoản để xác nhận.",
      data: {
        bookingId: booking._id,
        bookingCode: bookingData.bookingCode,
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
      message: error.message || "Lỗi server, vui lòng thử lại sau",
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

    console.log("🔔 [momoCallback] Nhận callback từ MoMo:");
    console.log("   resultCode:", resultCode);
    console.log("   extraData (bookingId):", extraData);
    console.log("   amount:", amount);

    if (resultCode === 0) {
      // Payment successful
      if (extraData) {
        const booking = await Booking.findById(extraData).populate("tourId");

        if (booking) {
          // Check if payment was already processed (to prevent duplicate notifications)
          const wasAlreadyPaid = booking.paymentStatus === "paid";

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
          console.log(
            "✅ [momoCallback] Booking cập nhật thành công:",
            booking._id
          );

          // Gửi thông báo booking mới (cho cả admin và client) - CHỈ LẦN ĐẦU
          // Nếu đã thanh toán rồi (F5 hoặc retry từ MoMo), không gửi notification lại
          if (!wasAlreadyPaid) {
            const user = await User.findById(booking.userId);
            await sendBookingNotification(
              booking,
              booking.tourId,
              user?.fullName || booking.contactInfo.name
            );
            console.log("📧 [momoCallback] Notification sent");
          } else {
            console.log(
              "⏭️ [momoCallback] Booking already paid, skipping notification to prevent duplicate"
            );
          }
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
    let query = Booking.find(filter)
      .populate("tourId", "name slug")
      .populate("userId", "fullName email")
      .populate("couponId", "code discountPercentage");

    // Sắp xếp cho tab "Hoàn/Hủy": dùng refundInfo.approvedAt cho refunded, cancelledAt cho cancelled
    if (status === "refunded_cancelled") {
      // Sử dụng aggregation pipeline để sắp xếp đúng
      const bookings = await Booking.aggregate([
        { $match: filter },
        {
          $addFields: {
            sortDate: {
              $cond: [
                { $eq: ["$bookingStatus", "refunded"] },
                "$refundInfo.approvedAt",
                "$cancelledAt",
              ],
            },
          },
        },
        { $sort: { sortDate: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]);

      // Populate data
      await Booking.populate(bookings, [
        { path: "tourId", select: "name slug" },
        { path: "userId", select: "fullName email" },
        { path: "couponId", select: "code discountPercentage" },
      ]);

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
    }

    // Sắp xếp mặc định cho các tab khác
    const bookings = await query
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
    booking.paymentMethod = "cash"; // Thanh toán tại quầy
    booking.payments.push({
      amount: booking.totalAmount,
      method: "cash",
      status: "paid",
      paidAt: new Date(),
    });
    booking.confirmedBy = adminId;
    booking.confirmedAt = new Date();
    await booking.save();

    console.log("\n=== confirmPayment Debug ===");
    console.log("1. Booking ID:", booking._id);
    console.log("2. User ID:", booking.userId);

    // Gửi email xác nhận thanh toán + xác nhận đơn
    console.log("3. Sending emails...");
    await EmailService.sendPaymentConfirmationEmail(booking, booking.tourId);
    await EmailService.sendBookingConfirmationEmail(booking, booking.tourId);
    console.log("✅ Emails sent");

    // Gửi notification cho client
    console.log("4. Sending client notification...");
    try {
      await notifyBookingPaid({
        userId: booking.userId,
        bookingId: booking._id,
        tourName: booking.tourId?.name || "Tour",
        paymentMethod: booking.paymentMethod,
      });
      console.log("✅ Client notification sent");
    } catch (notifError) {
      console.error(
        "❌ Error sending client notification:",
        notifError.message
      );
    }

    // Emit socket event for admin panel real-time update
    console.log("5. Emitting admin socket event...");
    if (global.io) {
      global.io.emit("booking:payment-confirmed", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
      console.log(
        "📢 [Socket] Emitted booking:payment-confirmed for id:",
        booking._id
      );
    } else {
      console.error("❌ global.io not available!");
    }
    console.log("=== confirmPayment Done ===\n");

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

    console.log("\n=== confirmBooking Debug ===");
    console.log("1. Booking ID:", booking._id);
    console.log("2. User ID:", booking.userId);

    // Gửi email xác nhận
    console.log("3. Sending confirmation email...");
    await EmailService.sendBookingConfirmationEmail(booking, booking.tourId);
    console.log("✅ Email sent");

    // Gửi notification cho client (chỉnh sửa lại)
    console.log("4. Sending client notification...");
    try {
      await notifyBookingPaid({
        userId: booking.userId,
        bookingId: booking._id,
        tourName: booking.tourId?.name || "Tour",
        paymentMethod: booking.paymentMethod || "online",
      });
      console.log("✅ Client notification sent");
    } catch (notifError) {
      console.error(
        "❌ Error sending client notification:",
        notifError.message
      );
    }

    // Emit socket event for admin panel real-time update
    console.log("5. Emitting admin socket event...");
    if (global.io) {
      global.io.emit("booking:confirmed", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
      console.log("📢 [Socket] Emitted booking:confirmed for id:", booking._id);
    } else {
      console.error("❌ global.io not available!");
    }
    console.log("=== confirmBooking Done ===\n");

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
    booking.completedAt = new Date();
    await booking.save();

    console.log("\n=== completeBooking Debug ===");
    console.log("1. Booking ID:", booking._id);
    console.log("2. User ID:", booking.userId);

    // Gửi email cảm ơn
    console.log("3. Sending thank you email...");
    const emailSent = await EmailService.sendCompletionThankYouEmail(
      booking,
      booking.tourId
    );
    console.log("✅ Email sent:", emailSent);

    // Gửi notification cho client
    console.log("4. Sending client notification...");
    try {
      await notifyBookingCompleted({
        userId: booking.userId,
        bookingId: booking._id,
        tourName: booking.tourId?.name || "Tour",
      });
      console.log("✅ Client notification sent");
    } catch (notifError) {
      console.error(
        "❌ Error sending client notification:",
        notifError.message
      );
    }

    // Emit socket event for admin panel real-time update
    console.log("5. Emitting admin socket event...");
    if (global.io) {
      global.io.emit("booking:completed", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
      console.log("📢 [Socket] Emitted booking:completed for id:", booking._id);
    } else {
      console.error("❌ global.io not available!");
    }
    console.log("=== completeBooking Done ===\n");

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
    const emailSent = await EmailService.sendRefundRequestApprovedEmail(
      booking
    );
    console.log("Gửi mail yêu cầu hoàn tiền:", emailSent);

    // Gửi notification cho client
    console.log("\n=== requestRefund Debug ===");
    console.log("1. Booking ID:", booking._id);
    console.log("2. User ID:", booking.userId);
    console.log("3. Sending client notification...");

    const notification = await notifyRefundRequested({
      userId: booking.userId,
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      tourName: booking.tourId?.name || "Tour",
    });
    console.log(
      "✅ Client notification sent:",
      notification ? "Success" : "Failed"
    );

    // Emit socket event for admin panel real-time update
    console.log("4. Emitting admin socket event...");
    if (global.io) {
      global.io.emit("booking:refund-requested", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
      console.log(
        "📢 [Socket] Emitted booking:refund-requested for id:",
        booking._id
      );
    } else {
      console.error("❌ global.io not available!");
    }
    console.log("=== requestRefund Done ===\n");

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

    console.log("\n=== approveRefund Debug ===");
    console.log("1. Booking ID:", booking._id);
    console.log("2. User ID:", booking.userId);
    console.log("3. Refund Amount:", parsedRefundAmount);

    // Gửi email hoàn tiền được duyệt
    console.log("4. Sending refund approved email...");
    await EmailService.sendRefundApprovedEmail(booking, parsedRefundAmount);
    console.log("✅ Email sent");

    // Gửi notification cho client
    console.log("5. Sending client notification...");
    try {
      await notifyRefundConfirmed({
        userId: booking.userId,
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        tourName: booking.tourId?.name || "Tour",
      });
      console.log("✅ Client notification sent");
    } catch (notifError) {
      console.error(
        "❌ Error sending client notification:",
        notifError.message
      );
    }

    // Emit socket event for admin panel real-time update
    console.log("6. Emitting admin socket event...");
    if (global.io) {
      global.io.emit("booking:refund-approved", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
      console.log(
        "📢 [Socket] Emitted booking:refund-approved for id:",
        booking._id
      );
    } else {
      console.error("❌ global.io not available!");
    }
    console.log("=== approveRefund Done ===\n");

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

    // Gửi email từ chối hoàn tiền
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

    const booking = await Booking.findById(bookingId).populate("tourId");
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

    console.log("\n=== cancelBooking Debug ===");
    console.log("1. Booking ID:", booking._id);
    console.log("2. User ID:", booking.userId);
    console.log("3. Cancellation Reason:", reason);

    // Gửi notification cho client
    console.log("4. Sending client notification...");
    try {
      await notifyCancellation({
        userId: booking.userId,
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        tourName: booking.tourId?.name || "Tour",
        cancellationReason: reason,
      });
      console.log("✅ Client notification sent");
    } catch (notifError) {
      console.error(
        "❌ Error sending client notification:",
        notifError.message
      );
    }

    // Emit socket event for admin panel real-time update
    console.log("5. Emitting admin socket event...");
    if (global.io) {
      global.io.emit("booking:cancelled", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
      console.log("📢 [Socket] Emitted booking:cancelled for id:", booking._id);
    } else {
      console.error("❌ global.io not available!");
    }
    console.log("=== cancelBooking Done ===\n");

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
