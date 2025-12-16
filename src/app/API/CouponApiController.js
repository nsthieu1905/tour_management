const { Khuyen_mai } = require("../models/index");
const { notifyPromotion } = require("../../utils/NotificationHelper");
const {
  validateCouponInput,
  validateApplyCoupon,
} = require("../../public/utils/validators");

// [GET] /api/coupons
const findAll = async (req, res) => {
  try {
    // Middleware sẽ tự động update status khi query
    const coupons = await Khuyen_mai.find().lean();

    if (!coupons || coupons.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy danh sách mã giảm giá",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách mã giảm giá thành công",
      data: coupons,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách mã giảm giá:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /api/coupons/:id
const findOne = async (req, res) => {
  try {
    // Middleware sẽ tự động update status
    const coupon = await Khuyen_mai.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết mã giảm giá thành công",
      data: coupon,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết mã giảm giá:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [POST] /api/coupons/add
const create = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      status,
    } = req.body;

    // Validate input
    const validation = validateCouponInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.errors,
      });
    }

    const existingCoupon = await Khuyen_mai.findOne({
      code: code.toUpperCase(),
    });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Mã code đã tồn tại",
      });
    }

    const newCoupon = new Khuyen_mai({
      code: code.toUpperCase(),
      name,
      description,
      type,
      value: Number(value),
      minPurchase: Number(minPurchase) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit: Number(usageLimit) || 0,
      perUserLimit: Number(perUserLimit) || 1,
      status: status || "active",
      usageCount: 0,
      createdBy: req.user?._id,
    });

    await newCoupon.save();

    try {
      await notifyPromotion({
        title: `Mã giảm giá mới: ${newCoupon.code}`,
        description:
          newCoupon.description ||
          `Giảm ${
            newCoupon.type === "percentage"
              ? newCoupon.value + "%"
              : newCoupon.value.toLocaleString() + " VNĐ"
          }`,
        link: "/",
        promotionId: newCoupon._id,
      });
    } catch (err) {
      console.error("Error sending promotion notification:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Thêm mã giảm giá thành công",
      data: newCoupon,
    });
  } catch (error) {
    console.error("Lỗi tạo mã giảm giá:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [PATCH] /api/coupons/:id
const update = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      status,
    } = req.body;

    // Validate input
    const validation = validateCouponInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.errors,
      });
    }

    if (code) {
      const existingCoupon = await Khuyen_mai.findOne({
        code: code.toUpperCase(),
        _id: { $ne: req.params.id },
      });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: "Mã code đã tồn tại",
        });
      }
    }

    const updateData = {};
    if (code) updateData.code = code.toUpperCase();
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type) updateData.type = type;
    if (value !== undefined) updateData.value = Number(value);
    if (minPurchase !== undefined) updateData.minPurchase = Number(minPurchase);
    if (maxDiscount !== undefined)
      updateData.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (usageLimit !== undefined) updateData.usageLimit = Number(usageLimit);
    if (perUserLimit !== undefined)
      updateData.perUserLimit = Number(perUserLimit);
    if (status) updateData.status = status;

    const coupon = await Khuyen_mai.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cập nhật mã giảm giá thành công",
      data: coupon,
    });
  } catch (error) {
    console.error("Lỗi cập nhật mã giảm giá:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [DELETE] /api/coupons/:id
const deleteOne = async (req, res) => {
  try {
    const coupon = await Khuyen_mai.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa mã giảm giá thành công",
      data: coupon,
    });
  } catch (error) {
    console.error("Lỗi xóa mã giảm giá:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [POST] /api/coupons/applyCoupon
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, tourId, originalPrice, departureDate, userId } =
      req.body;

    // Validate input
    const validation = validateApplyCoupon(couponCode, tourId, originalPrice);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu không hợp lệ",
        errors: validation.errors,
      });
    }

    const coupon = await Khuyen_mai.findOne({
      code: couponCode.toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không hợp lệ",
      });
    }

    const now = new Date();
    if (coupon.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá không hoạt động",
      });
    }

    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã hết hạn hoặc chưa bắt đầu",
      });
    }

    if (originalPrice < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Giá tối thiểu để áp dụng mã này là ${coupon.minPurchase.toLocaleString(
          "vi-VN"
        )}đ`,
      });
    }

    if (
      coupon.applicableTours &&
      coupon.applicableTours.length > 0 &&
      !coupon.applicableTours.includes(tourId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá không áp dụng cho tour này",
      });
    }

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã hết số lần sử dụng",
      });
    }

    // Tính toán giảm giá
    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = originalPrice * (coupon.value / 100);
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === "fixed_amount") {
      discountAmount = coupon.value;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    // Tăng usageCount
    coupon.usageCount += 1;
    await coupon.save();

    console.log(
      `✅ Coupon ${coupon.code} used. Count: ${coupon.usageCount}/${coupon.usageLimit}`
    );

    return res.status(200).json({
      success: true,
      message: "Áp dụng mã giảm giá thành công",
      data: {
        couponCode: coupon.code,
        couponName: coupon.name,
        type: coupon.type,
        value: coupon.value,
        discountAmount: Math.round(discountAmount),
        originalPrice,
        finalPrice: Math.round(finalPrice),
        savings: Math.round(discountAmount),
        usageCount: coupon.usageCount,
        usageLimit: coupon.usageLimit,
      },
    });
  } catch (error) {
    console.error("Lỗi áp dụng mã giảm giá:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

module.exports = {
  findAll,
  findOne,
  create,
  update,
  deleteOne,
  applyCoupon,
};
