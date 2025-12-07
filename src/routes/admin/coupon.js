const express = require("express");
const router = express.Router();
const couponController = require("../../app/API/CouponController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.use(protectAdminRoutes);

router.get("/", couponController.getAllCoupons);
router.get("/:id", couponController.getCouponById);
router.post("/add", couponController.addCoupon);
router.patch("/:id", couponController.updateCoupon);
router.delete("/:id", couponController.deleteCoupon);

module.exports = router;
