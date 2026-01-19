const mongoose = require("mongoose");
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

const updateTourCapacity = async (
  tourId,
  numberOfPeople,
  action = "increase",
) => {
  try {
    const tour = await Tour.findById(tourId);
    if (!tour) {
      throw new Error("Tour không tồn tại");
    }

    if (!tour.capacity) {
      tour.capacity = {
        max: 0,
        current: 0,
        available: 0,
      };
    }

    if (action === "increase") {
      tour.capacity.current = (tour.capacity.current || 0) + numberOfPeople;

      if (tour.capacity.max) {
        tour.capacity.available = tour.capacity.max - tour.capacity.current;

        if (tour.capacity.available <= 0) {
          tour.status = "soldout";
          tour.capacity.available = 0;
        }
      }
      tour.bookingCount = (tour.bookingCount || 0) + 1;
    } else if (action === "decrease") {
      tour.capacity.current = Math.max(
        0,
        (tour.capacity.current || 0) - numberOfPeople,
      );

      if (tour.capacity.max) {
        tour.capacity.available = tour.capacity.max - tour.capacity.current;

        if (tour.status === "soldout" && tour.capacity.available > 0) {
          tour.status = "active";
        }
      }

      tour.bookingCount = Math.max(0, (tour.bookingCount || 0) - 1);
    }

    await tour.save();

    return tour;
  } catch (error) {
    console.error("Error updating tour capacity:", error);
    throw error;
  }
};

const sendBookingNotification = async (booking, tour, customerName) => {
  try {
    const paymentDeadline = new Date(booking.createdAt);
    paymentDeadline.setDate(paymentDeadline.getDate() + 30);
    const formatDeadline = `${paymentDeadline
      .getDate()
      .toString()
      .padStart(2, "0")}/${(paymentDeadline.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
    await notifyNewBooking({
      userId: booking.userId,
      bookingId: booking._id,
      tourId: booking.tourId,
      bookingCode: booking.bookingCode,
      userName: customerName,
      tourName: tour?.name || "Tour",
      passengers: booking.numberOfPeople,
      paymentDeadline: formatDeadline,
    });
  } catch (error) {
    console.error("Error sending booking notification:", error);
  }
};

const validateAndParseBookingData = (body) => {
  const {
    tourId,
    customerName,
    customerEmail,
    customerPhone,
    guestCount,
    departureDate,
    total,
    extraServices,
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
    extraServices: Array.isArray(extraServices)
      ? extraServices
          .filter((x) => x && x.serviceId)
          .map((x) => ({
            serviceId: x.serviceId,
            quantity: Number(x.quantity) || 1,
            unitPrice: Number(x.unitPrice) || 0,
          }))
      : [],
  };
};

const validateExtraServiceStock = async ({ tour, requestedExtraServices }) => {
  const partnerServices = Array.isArray(tour?.partnerServices)
    ? tour.partnerServices
    : [];

  const offerByServiceId = new Map();
  const nameByServiceId = new Map();

  for (const ps of partnerServices) {
    if (!ps || ps.includedInTourPrice) continue;
    const sid = ps?.serviceId?._id
      ? String(ps.serviceId._id)
      : ps?.serviceId
        ? String(ps.serviceId)
        : "";
    if (!sid) continue;
    offerByServiceId.set(sid, Number(ps.quantity) || 0);
    nameByServiceId.set(sid, ps?.serviceId?.name || "");
  }

  if (!requestedExtraServices || requestedExtraServices.length === 0) {
    return { isValid: true };
  }

  const booked = await Booking.aggregate([
    {
      $match: {
        tourId: new mongoose.Types.ObjectId(tour._id),
        bookingStatus: { $nin: ["cancelled", "refunded"] },
      },
    },
    { $unwind: "$extraServices" },
    {
      $group: {
        _id: "$extraServices.serviceId",
        total: { $sum: "$extraServices.quantity" },
      },
    },
  ]);

  const usedByServiceId = new Map(
    (booked || []).map((x) => [String(x._id), Number(x.total) || 0]),
  );

  const requestedTotals = new Map();
  for (const item of requestedExtraServices) {
    const sid = item?.serviceId ? String(item.serviceId) : "";
    if (!sid) continue;
    const qty = Math.max(1, Number(item.quantity) || 1);
    requestedTotals.set(sid, (requestedTotals.get(sid) || 0) + qty);
  }

  for (const [sid, reqQty] of requestedTotals.entries()) {
    if (!offerByServiceId.has(sid)) {
      return {
        isValid: false,
        message: "Dịch vụ thêm không hợp lệ",
      };
    }
    const totalQty = offerByServiceId.get(sid) || 0;
    const usedQty = usedByServiceId.get(sid) || 0;
    const remaining = Math.max(0, totalQty - usedQty);
    if (remaining <= 0) {
      const name = nameByServiceId.get(sid) || "";
      return {
        isValid: false,
        message: `Dịch vụ '${name}' tạm hết`,
      };
    }
    if (reqQty > remaining) {
      const name = nameByServiceId.get(sid) || "";
      return {
        isValid: false,
        message: `Dịch vụ '${name}' chỉ còn ${remaining}`,
      };
    }
  }

  return { isValid: true };
};

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
    extraServices,
    couponCode,
    paymentMethod,
    bookingStatus,
    paymentStatus,
  } = params;

  let couponId = null;
  if (couponCode) {
    const coupon = await Khuyen_mai.findOne({
      code: couponCode.toUpperCase(),
    });
    if (coupon) {
      couponId = coupon._id;
    }
  }

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
    extraServices: Array.isArray(extraServices) ? extraServices : [],
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
    const { tourId, customerName, total, couponCode, guestCount } = req.body;

    const tour = await Tour.findById(tourId).populate({
      path: "partnerServices.serviceId",
      select: "name",
    });
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    if (tour.capacity && tour.capacity.max) {
      const availableSeats =
        tour.capacity.available ||
        tour.capacity.max - (tour.capacity.current || 0);
      if (availableSeats < guestCount) {
        return res.status(400).json({
          success: false,
          message: `Tour chỉ còn ${availableSeats} chỗ trống, không đủ cho ${guestCount} người`,
        });
      }
    }

    const stockValidation = await validateExtraServiceStock({
      tour,
      requestedExtraServices: validatedData.extraServices,
    });
    if (!stockValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: stockValidation.message,
      });
    }

    const totalAmount = Math.round(total);
    if (totalAmount < PAYMENT_LIMITS.MIN_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Số tiền thanh toán phải tối thiểu ${PAYMENT_LIMITS.MIN_AMOUNT.toLocaleString(
          "vi-VN",
        )} VND`,
      });
    }
    if (totalAmount > PAYMENT_LIMITS.MAX_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Số tiền thanh toán không được vượt quá ${PAYMENT_LIMITS.MAX_AMOUNT.toLocaleString(
          "vi-VN",
        )} VND`,
      });
    }

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
    const userId = req.user.userId;
    const validatedData = validateAndParseBookingData(req.body);
    const { tourId, customerName, couponCode, paymentMethod, guestCount } =
      req.body;

    const tour = await Tour.findById(tourId).populate({
      path: "partnerServices.serviceId",
      select: "name",
    });
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: "Tour không tồn tại",
      });
    }

    if (tour.capacity && tour.capacity.max) {
      const availableSeats =
        tour.capacity.available ||
        tour.capacity.max - (tour.capacity.current || 0);
      if (availableSeats < guestCount) {
        return res.status(400).json({
          success: false,
          message: `Tour chỉ còn ${availableSeats} chỗ trống, không đủ cho ${guestCount} người`,
        });
      }
    }

    const stockValidation = await validateExtraServiceStock({
      tour,
      requestedExtraServices: validatedData.extraServices,
    });
    if (!stockValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: stockValidation.message,
      });
    }

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

    await updateTourCapacity(tourId, guestCount, "increase");

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
      signature,
      partnerCode,
      responseTime,
    } = req.body;

    if (signature) {
      const isValidSignature = MoMoService.verifySignature(req.body);
      if (!isValidSignature) {
        return res.status(400).json({
          success: false,
          message: "Chữ ký không hợp lệ.",
        });
      }
    }

    const normalizedResultCode =
      typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;

    if (normalizedResultCode === 0) {
      if (extraData) {
        const booking = await Booking.findById(extraData).populate("tourId");

        if (booking) {
          if (booking.paymentStatus !== "paid") {
            booking.bookingStatus = "confirmed";
            booking.paymentStatus = "paid";

            const hasTx = (booking.payments || []).some(
              (p) => p?.transactionId === transId && p?.method === "momo",
            );
            if (!hasTx) {
              booking.payments.push({
                amount: parseInt(amount) || 0,
                method: "momo",
                transactionId: transId,
                status: "success",
                paidAt: new Date(),
              });
            }

            await booking.save();

            try {
              if (booking.tourId?._id && booking.numberOfPeople) {
                await updateTourCapacity(
                  booking.tourId._id,
                  booking.numberOfPeople,
                  "increase",
                );
              }
            } catch (capacityError) {
              console.error(
                "MoMo callback capacity update failed:",
                capacityError,
              );
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: "Thanh toán thành công",
      });
    } else {
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
    console.error("Momo callback error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
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
      message: "Lỗi máy chủ, vui lòng thử lại sau",
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
      message: "Lỗi máy chủ, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/bookings/admin/all
const getAllBookings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || "";
    const search = req.query.search || "";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";

    // Build filter
    const filter = {};

    if (status === "pre_pending") {
      filter.bookingStatus = "pending";
      filter.paymentStatus = "pending";
    } else if (status === "pending") {
      filter.bookingStatus = "pending";
      filter.paymentStatus = "paid";
    } else if (status === "refunded_cancelled") {
      filter.bookingStatus = { $in: ["refunded", "cancelled"] };
    } else {
      if (status) filter.bookingStatus = status;
    }

    // Filter by date range - Lọc theo ngày khởi hành
    if (startDate || endDate) {
      filter.departureDate = {};

      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        filter.departureDate.$gte = startDateTime;
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.departureDate.$lte = endDateTime;
      }
    }

    // Filter by search
    if (search) {
      filter.$or = [
        { bookingCode: { $regex: search, $options: "i" } },
        { "contactInfo.name": { $regex: search, $options: "i" } },
      ];
    }

    const total = await Booking.countDocuments(filter);

    let query = Booking.find(filter)
      .populate("tourId", "name slug")
      .populate("userId", "fullName email")
      .populate("couponId", "code discountPercentage");

    if (status === "refunded_cancelled") {
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
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/confirm-payment
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

    if (booking.paymentStatus !== "paid") {
      await updateTourCapacity(
        booking.tourId._id,
        booking.numberOfPeople,
        "increase",
      );
    }

    booking.bookingStatus = "confirmed";
    booking.paymentStatus = "paid";
    booking.paymentMethod = "cash";
    booking.payments.push({
      amount: booking.totalAmount,
      method: "cash",
      status: "paid",
      paidAt: new Date(),
    });
    booking.confirmedBy = adminId;
    booking.confirmedAt = new Date();
    await booking.save();

    // Gửi email xác nhận thanh toán + xác nhận đơn
    await EmailService.sendPaymentConfirmationEmail(booking, booking.tourId);
    await EmailService.sendBookingConfirmationEmail(booking, booking.tourId);

    // Gửi notification cho customer
    try {
      await notifyBookingPaid({
        userId: booking.userId,
        bookingId: booking._id,
        tourName: booking.tourId?.name || "Tour",
        paymentMethod: booking.paymentMethod,
      });
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    // Emit socket event for admin panel real-time update
    if (global.io) {
      global.io.emit("booking:payment-confirmed", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xác nhận thanh toán và đơn đặt tour thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/confirm-booking
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

    if (booking.bookingStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Trạng thái đơn không hợp lệ để xác nhận",
      });
    }

    booking.bookingStatus = "confirmed";
    booking.confirmedBy = adminId;
    booking.confirmedAt = new Date();
    await booking.save();

    // Gửi email xác nhận
    await EmailService.sendBookingConfirmationEmail(booking, booking.tourId);

    // Gửi notification cho customer (chỉnh sửa lại)
    try {
      await notifyBookingPaid({
        userId: booking.userId,
        bookingId: booking._id,
        tourName: booking.tourId?.name || "Tour",
        paymentMethod: booking.paymentMethod || "online",
      });
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    if (global.io) {
      global.io.emit("booking:confirmed", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xác nhận đơn đặt tour thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Confirm booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/complete
const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("tourId");
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt tour" });
    }

    if (booking.bookingStatus !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hoàn thành các đơn đã xác nhận",
      });
    }

    booking.bookingStatus = "completed";
    booking.completedAt = new Date();
    await booking.save();

    // Gửi email cảm ơn
    const emailSent = await EmailService.sendCompletionThankYouEmail(
      booking,
      booking.tourId,
    );

    // Gửi notification cho customer
    try {
      await notifyBookingCompleted({
        userId: booking.userId,
        bookingId: booking._id,
        tourName: booking.tourId?.name || "Tour",
      });
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    // Emit socket event for admin panel real-time update
    if (global.io) {
      global.io.emit("booking:completed", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hoàn thành tour thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Complete booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/request-refund
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
      booking.departureDate,
    );

    // Cập nhật trạng thái
    booking.bookingStatus = "refund_requested";
    booking.refundInfo = {
      reason,
      requestedAt: new Date(),
      daysUntilDeparture: refundCalc.daysUntilDeparture,
      refundPercentage: refundCalc.percentage,
    };
    await booking.save();

    await EmailService.sendRefundRequestApprovedEmail(booking);

    const notification = await notifyRefundRequested({
      userId: booking.userId,
      bookingId: booking._id,
      bookingCode: booking.bookingCode,
      tourName: booking.tourId?.name || "Tour",
    });

    if (global.io) {
      global.io.emit("booking:refund-requested", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
    }

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
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/approve-refund
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

    await updateTourCapacity(
      booking.tourId._id,
      booking.numberOfPeople,
      "decrease",
    );

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

    await EmailService.sendRefundApprovedEmail(booking, parsedRefundAmount);

    try {
      await notifyRefundConfirmed({
        userId: booking.userId,
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        tourName: booking.tourId?.name || "Tour",
      });
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    if (global.io) {
      global.io.emit("booking:refund-approved", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xác nhận hoàn tiền thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Approve refund error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/reject-refund
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

    booking.refundInfo.rejectionReason = rejectionReason;
    booking.bookingStatus = "confirmed";
    await booking.save();

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
      message: "Lỗi máy chủ, vui lòng thử lại sau",
      error: error.message,
    });
  }
};

// [POST] /api/admin/bookings/cancel
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

    await updateTourCapacity(
      booking.tourId._id,
      booking.numberOfPeople,
      "decrease",
    );

    booking.bookingStatus = "cancelled";
    booking.cancellationReason = reason;
    booking.cancelledBy = adminId;
    booking.cancelledAt = new Date();
    await booking.save();

    try {
      await notifyCancellation({
        userId: booking.userId,
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
        tourName: booking.tourId?.name || "Tour",
        cancellationReason: reason,
      });
    } catch (notifError) {
      console.error("Error sending notification:", notifError);
    }

    if (global.io) {
      global.io.emit("booking:cancelled", {
        bookingId: booking._id,
        bookingCode: booking.bookingCode,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Hủy đơn đặt tour thành công",
      data: booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau",
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
