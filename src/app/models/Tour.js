const mongoose = require("mongoose");

const tourSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    destination: { type: String, required: true },
    description: { type: String, required: true },
    detailedDescription: String,
    duration: {
      days: { type: Number, required: true },
      nights: { type: Number, required: true },
    },
    price: { type: Number, required: true },
    discountPrice: Number,
    currency: { type: String, default: "VND" },
    images: [String],
    thumbnail: String,
    category: {
      type: String,
      enum: ["beach", "mountain", "city", "cultural", "adventure", "relax"],
    },
    schedule: [
      {
        day: Number,
        title: String,
        activities: [String],
        meals: {
          breakfast: { type: Boolean, default: false },
          lunch: { type: Boolean, default: false },
          dinner: { type: Boolean, default: false },
        },
        accommodation: String,
      },
    ],
    included: [String],
    excluded: [String],
    capacity: {
      max: { type: Number, required: true },
      current: { type: Number, default: 0 },
      available: Number,
    },
    departureDate: { type: Date, required: true },
    returnDate: Date,
    departureDates: [Date],
    status: {
      type: String,
      enum: ["active", "paused", "soldout", "cancelled"],
      default: "active",
    },
    rating: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    highlights: [String],
    requirements: {
      minAge: { type: Number, default: 0 },
      maxAge: Number,
      fitnessLevel: {
        type: String,
        enum: ["easy", "moderate", "challenging", "difficult"],
        default: "easy",
      },
      specialRequirements: [String],
    },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Partner" },
    guideId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tags: [String],
    viewCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tour", tourSchema);
