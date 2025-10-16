const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["booking", "payment", "tour_update", "promotion", "system"],
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
