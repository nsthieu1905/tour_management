const { Khuyen_mai } = require("../models/index");

// [GET] /api/coupons
const getAllCoupons = async (req, res, next) => {
  try {
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
    next(error);
  }
};

// [GET] /api/coupons/:id
const getCouponById = async (req, res, next) => {
  try {
    const coupon = await Khuyen_mai.findById(req.params.id).lean();

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
    next(error);
  }
};

// [POST] /api/coupons/add
const addCoupon = async (req, res, next) => {
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

    // Kiểm tra mã code có tồn tại
    const existingCoupon = await Khuyen_mai.findOne({
      code: code.toUpperCase(),
    });
    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Mã code đã tồn tại",
      });
    }

    // Tạo mã giảm giá mới
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
      createdBy: req.user?._id,
    });

    await newCoupon.save();

    return res.status(201).json({
      success: true,
      message: "Thêm mã giảm giá thành công",
      data: newCoupon,
    });
  } catch (error) {
    next(error);
  }
};

// [PATCH] /api/coupons/:id
const updateCoupon = async (req, res, next) => {
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

    // Kiểm tra nếu code thay đổi
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
    next(error);
  }
};

// [DELETE] /api/coupons/:id
const deleteCoupon = async (req, res, next) => {
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
    next(error);
  }
};

// [POST] /api/coupons/validate-and-apply
const validateAndApplyCoupon = async (req, res, next) => {
  try {
    const { couponCode, tourId, originalPrice, departureDate } = req.body;

    // Kiểm tra input
    if (!couponCode || !tourId || !originalPrice) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết",
      });
    }

    // Tìm coupon
    const coupon = await Khuyen_mai.findOne({
      code: couponCode.toUpperCase(),
    }).lean();

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Mã giảm giá không hợp lệ",
      });
    }

    // Kiểm tra trạng thái coupon
    const now = new Date();
    if (coupon.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá không hoạt động",
      });
    }

    // Kiểm tra thời gian hợp lệ
    if (now < new Date(coupon.startDate) || now > new Date(coupon.endDate)) {
      return res.status(400).json({
        success: false,
        message: "Mã giảm giá đã hết hạn hoặc chưa bắt đầu",
      });
    }

    // Kiểm tra giá mua tối thiểu
    if (originalPrice < coupon.minPurchase) {
      return res.status(400).json({
        success: false,
        message: `Giá tối thiểu để áp dụng mã này là ${coupon.minPurchase.toLocaleString(
          "vi-VN"
        )}đ`,
      });
    }

    // Kiểm tra coupon áp dụng cho tour này (nếu có giới hạn)
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

    // Kiểm tra số lần sử dụng
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
      // Kiểm tra giới hạn giảm tối đa
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else if (coupon.type === "fixed_amount") {
      discountAmount = coupon.value;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

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
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCoupons,
  getCouponById,
  addCoupon,
  updateCoupon,
  deleteCoupon,
  validateAndApplyCoupon,
};
