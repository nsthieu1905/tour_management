const mongoose = require("mongoose");
const { Tour, Booking, User } = require("../../models/index");
const MoMoService = require("../../../services/MoMoService");
const { notifyPayment } = require("../../../utils/NotificationHelper");

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
    }

    await tour.save();
    return tour;
  } catch (error) {
    console.error("Error updating tour capacity:", error);
    throw error;
  }
};

// GET /booking/:slug
const bookingPage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug })
      .populate({
        path: "partnerServices.serviceId",
        populate: { path: "partnerId" },
      })
      .lean();

    if (tour?._id) {
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

      const bookedByServiceId = new Map(
        (booked || []).map((x) => [String(x._id), Number(x.total) || 0]),
      );

      tour.partnerServices = (tour.partnerServices || []).map((ps) => {
        if (!ps || ps.includedInTourPrice) return ps;
        const sid = ps?.serviceId?._id ? String(ps.serviceId._id) : "";
        const totalQty = Number(ps.quantity) || 0;
        const usedQty = sid ? bookedByServiceId.get(sid) || 0 : 0;
        const remainingQuantity = Math.max(0, totalQty - usedQty);
        return { ...ps, remainingQuantity };
      });
    }

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

    const normalizedResultCode =
      typeof resultCode === "string" ? parseInt(resultCode, 10) : resultCode;

    if (signature && extraData && resultCode !== undefined) {
      const isValidSignature = MoMoService.verifySignature(req.query);
      if (!isValidSignature) {
        return res.status(400).json({
          success: false,
          message: "Chữ ký không hợp lệ.",
        });
      }
    }

    if (normalizedResultCode === 0 && extraData) {
      setTimeout(async () => {
        try {
          const booking = await Booking.findById(extraData).populate("tourId");

          if (booking && booking.paymentStatus !== "paid") {
            booking.bookingStatus = "confirmed";
            booking.paymentStatus = "paid";
            booking.payments.push({
              amount: parseInt(amount) || 0,
              method: "momo",
              transactionId: transId,
              status: "success",
              paidAt: new Date(),
            });

            await booking.save();

            try {
              await updateTourCapacity(
                booking.tourId._id,
                booking.numberOfPeople,
                "increase",
              );
            } catch (capacityError) {
              console.error(`Fallback capacity update failed:`, capacityError);
            }

            try {
              const user = await User.findById(booking.userId);
              await notifyPayment({
                userId: booking.userId,
                bookingId: booking._id,
                bookingCode: booking.bookingCode,
                customerName: user?.fullName || booking.contactInfo.name,
                tourName: booking.tourId?.name || "Tour",
                amount: parseInt(amount) || 0,
              });
            } catch (notificationError) {
              console.error(`Fallback notification failed:`, notificationError);
            }
          }
        } catch (error) {
          console.error(`Fallback handler error:`, error);
        }
      }, 3000);
    }

    res.render("booking-success", {
      user: req.user,
      bookingId: extraData || "",
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
