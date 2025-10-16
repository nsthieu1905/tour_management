const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    depositAmount: { type: Number, default: 0 },
    remainingAmount: Number,
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid", "refunded"],
      default: "pending",
    },
    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["vnpay", "momo", "bank_transfer", "cash"],
    },
    departureDate: Date,
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

module.exports = mongoose.model("Booking", bookingSchema);
