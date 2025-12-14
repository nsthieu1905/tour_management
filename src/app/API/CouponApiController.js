const { Khuyen_mai } = require("../models/index");
const { notifyPromotion } = require("../../utils/NotificationHelper");

// [GET] /api/coupons
const findAll = async (req, res) => {
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

    // Gửi notification đến tất cả clients về mã giảm giá mới
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

    // Emit socket event for admin panel real-time update
    if (global.io) {
      global.io.emit("coupon:created", {
        couponId: newCoupon._id,
        code: newCoupon.code,
      });
      console.log("📢 [Socket] Emitted coupon:created for admin panels");
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

    // Emit socket event for real-time update
    if (global.io) {
      global.io.emit("coupon:updated", { couponId: req.params.id });
      console.log("📢 [Socket] Emitted coupon:updated for id:", req.params.id);
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

    // Emit socket event for real-time update
    if (global.io) {
      global.io.emit("coupon:deleted", { couponId: req.params.id });
      console.log("📢 [Socket] Emitted coupon:deleted for id:", req.params.id);
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
