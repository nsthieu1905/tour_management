const mongoose = require("mongoose");

const thongKeSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true, unique: true },
    revenue: {
      total: { type: Number, default: 0 },
      byTour: [
        {
          tourId: { type: mongoose.Schema.Types.ObjectId, ref: "Tour" },
          amount: Number,
          bookings: Number,
        },
      ],
      byPaymentMethod: mongoose.Schema.Types.Mixed,
    },
    bookings: {
      total: { type: Number, default: 0 },
      confirmed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
    },
    customers: {
      new: { type: Number, default: 0 },
      returning: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    tours: {
      active: { type: Number, default: 0 },
      soldOut: { type: Number, default: 0 },
      averageOccupancy: { type: Number, default: 0 },
    },
    topDestinations: [
      {
        destination: String,
        bookings: Number,
        revenue: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Thong_ke", thongKeSchema);
