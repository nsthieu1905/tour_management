const mongoose = require("mongoose");

const khuyenMaiSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: ["percentage", "fixed_amount", "free_service"],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: Number,
    applicableTours: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tour",
      },
    ],
    usageLimit: {
      type: Number,
      default: 0,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    perUserLimit: {
      type: Number,
      default: 1,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

khuyenMaiSchema.virtual("computedStatus").get(function () {
  const now = new Date();
  const isExpired = now > this.endDate;
  const isUsageLimitReached =
    this.usageLimit > 0 && this.usageCount >= this.usageLimit;

  if (isExpired) return "expired";
  if (isUsageLimitReached) return "inactive";
  return this.status;
});

khuyenMaiSchema.methods.checkAndUpdateStatus = async function () {
  const now = new Date();
  const isExpired = now > this.endDate;
  const isUsageLimitReached =
    this.usageLimit > 0 && this.usageCount >= this.usageLimit;

  let shouldUpdate = false;
  let newStatus = this.status;

  if (isExpired && this.status !== "expired") {
    newStatus = "expired";
    shouldUpdate = true;
  } else if (isUsageLimitReached && this.status === "active") {
    newStatus = "inactive";
    shouldUpdate = true;
  }

  if (shouldUpdate) {
    this.status = newStatus;
    await this.save();
    return { updated: true, newStatus };
  }

  return { updated: false, currentStatus: this.status };
};

khuyenMaiSchema.pre(/^find/, async function (next) {
  this._startTime = Date.now();
  next();
});

khuyenMaiSchema.post(/^find/, async function (docs, next) {
  if (!docs) return next();

  const now = new Date();
  const docsArray = Array.isArray(docs) ? docs : [docs];

  const bulkOps = [];

  for (const doc of docsArray) {
    if (!doc) continue;

    const isExpired = now > new Date(doc.endDate);
    const isUsageLimitReached =
      doc.usageLimit > 0 && doc.usageCount >= doc.usageLimit;

    let newStatus = null;

    if (isExpired && doc.status !== "expired") {
      newStatus = "expired";
    } else if (isUsageLimitReached && doc.status === "active") {
      newStatus = "inactive";
    }

    if (newStatus) {
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { status: newStatus } },
        },
      });
    }
  }

  if (bulkOps.length > 0) {
    await this.model.bulkWrite(bulkOps);
  }

  next();
});

khuyenMaiSchema.pre("save", function (next) {
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error("Ngày kết thúc phải lớn hơn ngày bắt đầu"));
  }

  if (this.isNew) {
    const now = new Date();
    if (now > this.endDate) {
      this.status = "expired";
    } else if (now < this.startDate) {
      this.status = "inactive";
    }
  }

  next();
});

khuyenMaiSchema.statics.updateExpiredCoupons = async function () {
  const now = new Date();

  const expiredResult = await this.updateMany(
    {
      endDate: { $lt: now },
      status: { $ne: "expired" },
    },
    {
      $set: { status: "expired" },
    }
  );

  const usageLimitResult = await this.updateMany(
    {
      usageLimit: { $gt: 0 },
      $expr: { $gte: ["$usageCount", "$usageLimit"] },
      status: "active",
    },
    {
      $set: { status: "inactive" },
    }
  );

  return {
    expiredUpdated: expiredResult.modifiedCount,
    usageLimitUpdated: usageLimitResult.modifiedCount,
  };
};

khuyenMaiSchema.index({ status: 1 });
khuyenMaiSchema.index({ endDate: 1 });
khuyenMaiSchema.index({ startDate: 1, endDate: 1 });

khuyenMaiSchema.set("toJSON", { virtuals: true });
khuyenMaiSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Khuyen_mai", khuyenMaiSchema);
