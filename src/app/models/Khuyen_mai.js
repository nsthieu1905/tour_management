const mongoose = require("mongoose");

const khuyenMaiSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ["percentage", "fixed_amount", "free_service"],
      required: true,
    },
    value: { type: Number, required: true },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: Number,
    applicableTours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tour" }],
    usageLimit: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Khuyen_mai", khuyenMaiSchema);
