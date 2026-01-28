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
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TourCategory",
      default: null,
    },
    images: {
      type: [String],
      required: true,
    },
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
      },
      current: {
        type: Number,
        default: 0,
      },
      available: Number,
    },
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
    partnerServices: [
      {
        serviceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "PartnerService",
          required: true,
        },
        quantity: {
          type: Number,
          default: 1,
        },
        includedInTourPrice: {
          type: Boolean,
          default: true,
        },
        note: {
          type: String,
          default: "",
        },
      },
    ],
    highlights: [String],
    tags: [String],
    bookingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

mongoose.plugin(slug);
tourSchema.plugin(mongooseDelete, {
  overrideMethods: "all",
  deletedAt: true,
});
module.exports = mongoose.model("Tour", tourSchema);
