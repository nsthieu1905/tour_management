const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ["tour", "booking", "user", "partner", "review"],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
