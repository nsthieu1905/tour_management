const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "customer", "partner"],
      default: "customer",
    },
    avatar: String,
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    address: {
      street: String,
      city: String,
      district: String,
      country: String,
    },
    customerType: {
      type: String,
      enum: ["VIP", "regular", "new"],
      default: "new",
    },
    totalSpent: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    lastBookingDate: Date,
    metadata: {
      lastLogin: Date,
      loginCount: { type: Number, default: 0 },
      preferredDestinations: [String],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
