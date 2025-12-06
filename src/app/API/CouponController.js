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

module.exports = {
  getAllCoupons,
  getCouponById,
  addCoupon,
  updateCoupon,
  deleteCoupon,
};
