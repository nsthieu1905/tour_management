const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
const Schema = mongoose.Schema;

const tourCategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      slug: "name",
      slugPaddingSize: 5,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

mongoose.plugin(slug);

module.exports = mongoose.model("TourCategory", tourCategorySchema);
