const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    content: String,
    images: [String],
    pros: [String],
    cons: [String],
    ratings: {
      service: Number,
      value: Number,
      cleanliness: Number,
      location: Number,
      facilities: Number,
    },
    helpful: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    response: {
      content: String,
      respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      respondedAt: Date,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
