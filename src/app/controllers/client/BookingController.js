const { Tour, Booking, User } = require("../../models/index");
const MoMoService = require("../../../services/MoMoService");
const { notifyPayment } = require("../../../utils/NotificationHelper");

// GET /booking/:slug
const bookingPage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).lean();

    res.render("tour-booking", {
      tour: tour,
      user: req.user,
    });
  } catch (error) {
    console.error("Booking page error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// GET /booking-success
const bookingSuccess = async (req, res) => {
  try {
    const { resultCode, extraData, signature, transId, amount } = req.query;

    if (resultCode !== undefined) {
      // Verify signature
      if (signature && extraData) {
        const isValidSignature = MoMoService.verifySignature(req.query);

        if (!isValidSignature) {
          return res.status(400).json({
            success: false,
            message: "Chữ ký không hợp lệ.",
          });
        }
      }

      // Process payment callback
      if (resultCode === "0" && extraData) {
        // Payment successful
        const booking = await Booking.findById(extraData).populate("tourId");

        if (booking) {
          // Check if payment was already processed (to prevent duplicate notifications)
          const wasAlreadyPaid = booking.paymentStatus === "paid";

          booking.bookingStatus = "pending";
          booking.paymentStatus = "paid";
          booking.payments.push({
            amount: parseInt(amount) || 0,
            method: "momo",
            transactionId: transId,
            status: "success",
            paidAt: new Date(),
          });

          await booking.save();

          // ==================== SEND NOTIFICATION ====================
          // CHỈ GỬI LẦN ĐẦU (không gửi lại khi F5)
          if (!wasAlreadyPaid) {
            try {
              const user = await User.findById(booking.userId);
              const tour = booking.tourId;

              console.log("🔔 [BookingController] Triggering notifyPayment");
              console.log("   User ID:", booking.userId);
              console.log("   Booking ID:", booking._id);
              console.log("   Customer Name:", user?.fullName || "N/A");
              console.log("   Amount:", parseInt(amount) || 0);

              // Notify both admin and client about payment
              await notifyPayment({
                userId: booking.userId?._id,
                paymentId: booking._id,
                bookingId: booking._id,
                bookingCode: booking.bookingCode,
                customerName: user?.fullName || booking.contactInfo.name,
                tourName: booking.tourId?.name || "Tour",
                amount: parseInt(amount) || 0,
              });

              console.log("✅ Payment notification sent successfully");
            } catch (notificationError) {
              console.error(
                "⚠️ Error sending payment notification:",
                notificationError
              );
              // Continue even if notification fails
            }
          } else {
            console.log(
              "⏭️ [BookingController] Booking already paid, skipping notification to prevent duplicate"
            );
          }
          // ========================================================
        }
      } else if (extraData) {
        // Payment failed
        const booking = await Booking.findById(extraData);

        if (booking) {
          booking.payments.push({
            amount: parseInt(amount) || 0,
            method: "momo",
            transactionId: transId,
            status: "failed",
            paidAt: new Date(),
          });

          await booking.save();
        }
      }
    }

    res.render("booking-success", {
      user: req.user,
    });
  } catch (error) {
    console.error("Booking success page error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// GET /booking-details/:bookingId
const bookingDetails = async (req, res) => {
  try {
    res.render("booking-detail", {
      bookingId: req.params.bookingId,
      user: req.user,
    });
  } catch (error) {
    console.error("Booking details page error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// GET /my-bookings
const myBookings = async (req, res) => {
  try {
    res.render("my-bookings", {
      bodyClass: "bg-gray-50",
      user: req.user,
    });
  } catch (error) {
    console.error("My bookings page error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

module.exports = {
  bookingPage,
  bookingSuccess,
  bookingDetails,
  myBookings,
};
