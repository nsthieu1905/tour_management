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
    website: String,
    address: { street: String, city: String, country: String },
    logo: String,
    description: String,
    contactPerson: {
      name: String,
      position: String,
      phone: String,
      email: String,
    },
    businessInfo: {
      taxCode: String,
      businessLicense: String,
      bankAccount: String,
      bankName: String,
    },
    services: [String],
    toursProvided: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tour" }],
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    totalRevenue: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    contractStart: Date,
    contractEnd: Date,
    documents: [{ name: String, type: String, url: String, uploadedAt: Date }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doi_tac", doiTacSchema);
