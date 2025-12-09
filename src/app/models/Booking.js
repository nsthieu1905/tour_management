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
      address: String,
    },
    participants: [
      {
        name: String,
        age: Number,
        gender: { type: String, enum: ["male", "female", "other"] },
        idNumber: String,
        specialRequirements: String,
      },
    ],
    numberOfPeople: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Khuyen_mai",
      required: false,
    },
    depositAmount: { type: Number, default: 0 },
    remainingAmount: Number,
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "refunded"],
      default: "pending",
    },
    bookingStatus: {
      type: String,
      enum: ["pre_booking", "pending", "confirmed", "cancelled", "completed"],
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
    specialRequests: String,
    cancellationReason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    cancelledAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    confirmedAt: Date,
    payments: [
      {
        amount: Number,
        method: String,
        transactionId: String,
        status: String,
        paidAt: Date,
      },
    ],
    notes: String,
  },
  { timestamps: true }
);

bookingSchema.pre("save", function (next) {
  if (this.isNew && this.bookingStatus === "pre_booking") {
    this.expiresAt = new Date(Date.now() + 3 * 60 * 1000);
  }

  // Nếu chuyển sang confirmed, xóa expiresAt
  if (this.isModified("bookingStatus") && this.bookingStatus === "confirmed") {
    this.expiresAt = undefined;
  }

  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
