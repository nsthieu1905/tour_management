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
    extraServices: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PartnerService",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        unitPrice: {
          type: Number,
          default: 0,
        },
      },
    ],
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

    refundInfo: {
      reason: String,
      requestedAt: Date,
      daysUntilDeparture: Number,
      refundPercentage: {
        type: Number,
        default: null,
        min: 0,
        max: 100,
      },
      refundAmount: Number,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      approvedAt: Date,
      rejectionReason: String,
    },

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

    reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Feedback" },
  },
  { timestamps: true }
);

bookingSchema.pre("save", function (next) {
  if (this.isNew && this.bookingStatus === "pre_booking") {
    this.expiresAt = new Date(Date.now() + 3 * 60 * 1000);
  }

  if (
    this.isModified("bookingStatus") &&
    this.bookingStatus !== "pre_booking"
  ) {
    this.expiresAt = undefined;
  }

  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
