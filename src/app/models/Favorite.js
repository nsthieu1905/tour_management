const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const favoriteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tourId: {
      type: Schema.Types.ObjectId,
      ref: "Tour",
      required: true,
    },
    isFavorited: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ userId: 1, tourId: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);
