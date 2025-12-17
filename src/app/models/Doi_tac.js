const mongoose = require("mongoose");

const doiTacSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    destination: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String,
      trim: true,
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
