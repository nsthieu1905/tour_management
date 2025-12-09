const { Booking, Tour, User, Khuyen_mai } = require("../models/index");
const MoMoService = require("../services/MoMoService");
const { PAYMENT_LIMITS } = require("../services/MoMoService");

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
      paymentStatus: "pending",
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
      // Payment successful - Update pre_booking to confirmed
      if (extraData) {
        const booking = await Booking.findById(extraData);

        if (booking) {
          booking.bookingStatus = "confirmed";
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

module.exports = {
  createMoMoPayment,
  createBankPayment,
  momoCallback,
  getBooking,
  getUserBookings,
};
