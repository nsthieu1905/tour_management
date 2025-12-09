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
    // ✨ THAY ĐỔI 1: Thêm "pre_booking" vào enum
    bookingStatus: {
      type: String,
      enum: ["pre_booking", "pending", "confirmed", "cancelled", "completed"],
      default: "pre_booking", // ✨ Mặc định là pre_booking
    },
    paymentMethod: {
      type: String,
      enum: ["vnpay", "momo", "bank_transfer", "cash"],
    },
    departureDate: Date,
    // ✨ THAY ĐỔI 2: Thêm field expiresAt với TTL index
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // TTL index - MongoDB tự động xóa khi hết hạn
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

// ✨ THAY ĐỔI 3: Middleware tự động set expiresAt cho pre_booking
bookingSchema.pre("save", function (next) {
  // Nếu là booking mới và status = pre_booking
  if (this.isNew && this.bookingStatus === "pre_booking") {
    // Set expire sau 5 phút
    this.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  }

  // Nếu chuyển sang confirmed, xóa expiresAt
  if (this.isModified("bookingStatus") && this.bookingStatus === "confirmed") {
    this.expiresAt = undefined;
  }

  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
