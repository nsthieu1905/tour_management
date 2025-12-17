const mongoose = require("mongoose");

const partnerServiceSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doi_tac",
      required: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: "other",
    },
    unit: {
      type: String,
      enum: ["per_booking", "per_person", "per_day"],
      default: "per_booking",
    },
    price: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PartnerService", partnerServiceSchema);
