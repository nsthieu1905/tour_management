const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Session", sessionSchema);
