const { Booking, Tour, User } = require("../models/index");
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
      total,
      userId,
    } = req.body;

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
        )} VND. Vui lòng liên hệ hỗ trợ để thanh toán qua cách khác`,
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

    // Create booking
    const bookingData = {
      bookingCode,
      tourId,
      contactInfo: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      numberOfPeople: guestCount,
      totalAmount: total,
      departureDate: departureDateObj,
      paymentMethod: paymentMethod || "momo",
      paymentStatus: "pending",
      bookingStatus: "pending",
    };

    // Add userId if provided (from current logged-in user)
    if (userId) {
      bookingData.userId = userId;
    }

    const booking = new Booking(bookingData);

    await booking.save();

    // Create MoMo payment request
    const paymentData = {
      bookingId: booking._id.toString(),
      tourName: tour.name,
      customerName,
      amount: Math.round(total), // MoMo yêu cầu số nguyên
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
      // Delete booking nếu tạo payment request thất bại
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
      total,
      paymentMethod,
      userId,
    } = req.body;

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

    // Generate unique booking code
    const bookingCode = "BK" + new Date().getTime();

    // Create booking data
    const bookingData = {
      bookingCode,
      tourId,
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

    // Add userId if provided (from current logged-in user)
    if (userId) {
      bookingData.userId = userId;
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

    console.log("MoMo Callback received:", req.body);

    if (resultCode === 0) {
      // Payment successful
      // Find booking by extraData (bookingId)
      if (extraData) {
        const booking = await Booking.findById(extraData);

        if (booking) {
          booking.paymentStatus = "paid";
          booking.bookingStatus = "confirmed";
          booking.payments.push({
            amount,
            method: "momo",
            transactionId: transId,
            status: "success",
            paidAt: new Date(),
          });

          await booking.save();

          console.log(`Booking ${booking._id} marked as paid`);
        }
      }

      return res.status(200).json({
        success: true,
        message: "Thanh toán thành công",
      });
    } else {
      // Payment failed
      if (extraData) {
        const booking = await Booking.findById(extraData);
        if (booking) {
          booking.paymentStatus = "pending";
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
    const booking = await Booking.findById(req.params.bookingId).populate(
      "tourId"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đặt tour",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
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

module.exports = {
  createMoMoPayment,
  createBankPayment,
  momoCallback,
  getBooking,
};
