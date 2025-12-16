const mongoose = require("mongoose");

const doiTacSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["Tour operator", "Khách sạn", "Lữ hành", "Nhà hàng", "Khác"],
      required: true,
    },
    email: { type: String, required: true },
    phone: String,
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalRevenue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doi_tac", doiTacSchema);
