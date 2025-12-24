const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    recipientType: {
      type: String,
      enum: ["admin", "customer", "user", "promotion"],
      default: "user",
    },
    type: {
      type: String,
      enum: [
        "booking",
        "payment",
        "refund",
        "tour_update",
        "promotion",
        "alert",
        "system",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    icon: String,
    link: String,
    data: mongoose.Schema.Types.Mixed,
    read: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    expiresAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
