const express = require("express");
const router = express.Router();
const couponController = require("../../../app/API/CouponController");
const protectAdminRoutes = require("../../../middleware/protectAdminRoutes");

// Áp dụng middleware bảo vệ cho tất cả API routes
router.use(protectAdminRoutes);

// [GET] /api/coupons - Lấy danh sách mã giảm giá
router.get("/", couponController.getAllCoupons);

// [GET] /api/coupons/:id - Lấy chi tiết mã giảm giá
router.get("/:id", couponController.getCouponById);

// [POST] /api/coupons/add - Thêm mã giảm giá mới
router.post("/add", couponController.addCoupon);

// [PATCH] /api/coupons/:id - Cập nhật mã giảm giá
router.patch("/:id", couponController.updateCoupon);

// [DELETE] /api/coupons/:id - Xóa mã giảm giá
router.delete("/:id", couponController.deleteCoupon);

module.exports = router;
