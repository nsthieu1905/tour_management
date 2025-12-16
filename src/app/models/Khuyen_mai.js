const mongoose = require("mongoose");

const khuyenMaiSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    description: String,
    type: {
      type: String,
      enum: ["percentage", "fixed_amount", "free_service"],
      required: true,
    },
    value: { type: Number, required: true },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: Number,
    applicableTours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tour" }],
    usageLimit: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// ============================================================================
// VIRTUAL FIELD - Computed Status (không lưu vào DB)
// ============================================================================
khuyenMaiSchema.virtual("computedStatus").get(function () {
  const now = new Date();
  const isExpired = now > this.endDate;
  const isUsageLimitReached =
    this.usageLimit > 0 && this.usageCount >= this.usageLimit;

  if (isExpired) return "expired";
  if (isUsageLimitReached) return "inactive";
  return this.status;
});

// ============================================================================
// INSTANCE METHOD - Check and Update Status
// ============================================================================
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

// ============================================================================
// PRE-FIND MIDDLEWARE - Auto update status before queries
// ============================================================================
khuyenMaiSchema.pre(/^find/, async function (next) {
  // Chỉ chạy khi query thực sự được execute
  this._startTime = Date.now();
  next();
});

// POST-FIND MIDDLEWARE - Update status sau khi query
khuyenMaiSchema.post(/^find/, async function (docs, next) {
  if (!docs) return next();

  const now = new Date();
  const docsArray = Array.isArray(docs) ? docs : [docs];

  // Batch update các documents cần thay đổi status
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

  // Bulk update để tối ưu performance
  if (bulkOps.length > 0) {
    await this.model.bulkWrite(bulkOps);
  }

  next();
});

// ============================================================================
// PRE-SAVE MIDDLEWARE - Validate dates and auto-set status
// ============================================================================
khuyenMaiSchema.pre("save", function (next) {
  // Validate dates
  if (this.startDate && this.endDate && this.startDate >= this.endDate) {
    return next(new Error("Ngày kết thúc phải lớn hơn ngày bắt đầu"));
  }

  // Auto-set status based on dates if creating new
  if (this.isNew) {
    const now = new Date();
    if (now > this.endDate) {
      this.status = "expired";
    } else if (now < this.startDate) {
      this.status = "inactive"; // Chưa bắt đầu
    }
  }

  next();
});

// ============================================================================
// STATIC METHOD - Bulk update expired coupons (for cron job)
// ============================================================================
khuyenMaiSchema.statics.updateExpiredCoupons = async function () {
  const now = new Date();

  // Update expired coupons
  const expiredResult = await this.updateMany(
    {
      endDate: { $lt: now },
      status: { $ne: "expired" },
    },
    {
      $set: { status: "expired" },
    }
  );

  // Update usage limit reached coupons
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

// ============================================================================
// INDEX - Optimize queries
// ============================================================================
khuyenMaiSchema.index({ status: 1 });
khuyenMaiSchema.index({ endDate: 1 });
khuyenMaiSchema.index({ startDate: 1, endDate: 1 });

// Enable virtuals in JSON
khuyenMaiSchema.set("toJSON", { virtuals: true });
khuyenMaiSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Khuyen_mai", khuyenMaiSchema);
