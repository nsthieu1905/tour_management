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

    // ✨ Tạo PRE_BOOKING (sẽ tự động expire sau 5 phút)
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
      bookingStatus: "pre_booking", // ✨ Set status = pre_booking
      paymentStatus: "pending",
      // expiresAt sẽ được set tự động bởi middleware
    };

    if (couponId) {
      bookingData.couponId = couponId;
    }

    const booking = new Booking(bookingData);
    await booking.save();

    console.log(
      `✅ Pre-booking created: ${booking._id}, expires at: ${booking.expiresAt}`
    ); // Create MoMo payment request
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
      // Delete pre-booking nếu tạo payment request thất bại
      await Booking.findByIdAndDelete(booking._id);

      return res.status(400).json({
        success: false,
        message: "Không thể tạo yêu cầu thanh toán. Vui lòng thử lại",
      });
    }
  } catch (error) {
    console.error("Create MoMo payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
      error: error.message,
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
    const userId = req.user.userId; // From protectClientRoutes middleware

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

    // Handle coupon code - just store couponId, validation already done on client
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

    // Add coupon info if applied
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
    console.error("Create bank payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
      error: error.message,
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

    console.log("🔔 ==========================================");
    console.log("🔔 MoMo Callback received!");
    console.log("🔔 Full body:", JSON.stringify(req.body, null, 2));
    console.log("🔔 extraData:", extraData);
    console.log("🔔 resultCode:", resultCode);
    console.log("🔔 ==========================================");

    if (resultCode === 0) {
      // ✨ Payment successful - Update pre_booking thành confirmed
      console.log("✅ Result code = 0 (SUCCESS)");

      if (extraData) {
        console.log(`📂 Fetching booking with ID: ${extraData}`);
        const booking = await Booking.findById(extraData);

        if (booking) {
          console.log(`✅ Found booking: ${booking._id}`);
          console.log(
            `   - Before: bookingStatus=${booking.bookingStatus}, paymentStatus=${booking.paymentStatus}`
          );

          // ✨ Update status (middleware will clear expiresAt)
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

          console.log(`✅ Booking ${booking._id} confirmed and marked as paid`);
          console.log(
            `   - After: bookingStatus=${booking.bookingStatus}, paymentStatus=${booking.paymentStatus}`
          );
          console.log(`   - expiresAt: ${booking.expiresAt}`);
        } else {
          console.error(`❌ Booking not found with ID: ${extraData}`);
        }
      } else {
        console.warn("⚠️ extraData is empty!");
      }

      return res.status(200).json({
        success: true,
        message: "Thanh toán thành công",
      });
    } else {
      // ✨ Payment failed - Giữ nguyên pre_booking, sẽ tự động expire
      console.log(`❌ Result code != 0 (FAILED): ${resultCode}`);

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
          console.log(
            `⚠️ Payment failed for booking ${booking._id}, will auto-expire`
          );
        }
      }

      return res.status(400).json({
        success: false,
        message: `Thanh toán thất bại: ${message}`,
        resultCode,
      });
    }
  } catch (error) {
    console.error("MoMo callback error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi xử lý callback",
      error: error.message,
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
    console.error("Get booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
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
    console.error("Get user bookings error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
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
};
