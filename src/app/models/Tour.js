const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
const Schema = mongoose.Schema;
const mongooseDelete = require("mongoose-delete");

const tourSchema = new Schema(
  {
    tourCode: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      slug: "name",
      slugPaddingSize: 5,
      unique: true,
    },
    destination: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      days: {
        type: Number,
        required: true,
      },
      nights: {
        type: Number,
        required: true,
      },
    },
    price: {
      type: Number,
      required: true,
    },
    tourType: {
      type: String,
      enum: ["Tiết kiệm", "Tiêu chuẩn", "Giá tốt", "Cao cấp"],
    },
    // discountPrice, promotionPrice: đã bỏ vì không dùng
    images: {
      type: [String],
      required: true,
    },
    // category: đã bỏ vì không dùng
    schedule: [
      {
        day: Number,
        title: String,
        activities: [String],
        meals: {
          breakfast: {
            type: Boolean,
            default: false,
          },
          lunch: {
            type: Boolean,
            default: false,
          },
          dinner: {
            type: Boolean,
            default: false,
          },
        },
        accommodation: String,
      },
    ],
    itinerary: [
      {
        day: {
          type: Number,
          required: true,
        },
        destinations: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
    includes: [String],
    excludes: [String],
    capacity: {
      max: {
        type: Number,
        // required: true,
      },
      current: {
        type: Number,
        default: 0,
      },
      available: Number,
    },
    // returnDate: đã bỏ vì không dùng
    departureDates: [
      {
        date: {
          type: Date,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "paused", "soldout", "cancelled"],
      default: "active",
    },
    rating: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    highlights: [String],
    // requirements, partnerId, guideId, viewCount: đã bỏ vì không dùng
    tags: [String],
    bookingCount: {
      type: Number,
      default: 0,
    },
    // createdBy: đã bỏ vì không dùng
  },
  { timestamps: true }
);

mongoose.plugin(slug);
tourSchema.plugin(mongooseDelete, {
  overrideMethods: "all",
  deletedAt: true,
});
module.exports = mongoose.model("Tour", tourSchema);
