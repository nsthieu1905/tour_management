const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: true,
      unique: true,
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    contactInfo: {
      name: String,
      email: String,
      phone: String,
    },
    numberOfPeople: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Khuyen_mai",
      required: false,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "refunded"],
      default: "pending",
    },
    bookingStatus: {
      type: String,
      enum: [
        "pre_booking",
        "pending",
        "confirmed",
        "refund_requested",
        "refunded",
        "completed",
        "cancelled",
      ],
      default: "pre_booking",
    },
    paymentMethod: {
      type: String,
      enum: ["vnpay", "momo", "bank_transfer", "cash"],
    },
    departureDate: Date,
    expiresAt: {
      type: Date,
      index: { expires: 0 },
    },

    // Hoàn tiền fields
    refundInfo: {
      reason: String, // Lý do hủy tour
      requestedAt: Date, // Ngày yêu cầu hoàn tiền
      daysUntilDeparture: Number, // Số ngày còn lại đến ngày khởi hành
      refundPercentage: {
        // % hoàn tiền (100, 50, 0)
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      refundAmount: Number, // Số tiền được hoàn
      approvedBy: {
        // Admin xác nhận hoàn tiền
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date, // Ngày xác nhận hoàn tiền
      rejectionReason: String, // Lý do từ chối hoàn tiền
    },

    // Hủy tour fields
    cancellationReason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    confirmedAt: Date,
    completedAt: Date,
    payments: [
      {
        amount: Number,
        method: String,
        transactionId: String,
        status: String,
        paidAt: Date,
      },
    ],
  },
  { timestamps: true }
);

bookingSchema.pre("save", function (next) {
  // Set expiresAt cho pre_booking lần đầu (3 phút)
  if (this.isNew && this.bookingStatus === "pre_booking") {
    this.expiresAt = new Date(Date.now() + 3 * 60 * 1000);
  }

  // Xóa expiresAt khi chuyển sang trạng thái không phải pre_booking
  if (
    this.isModified("bookingStatus") &&
    this.bookingStatus !== "pre_booking"
  ) {
    this.expiresAt = undefined;
  }

  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
