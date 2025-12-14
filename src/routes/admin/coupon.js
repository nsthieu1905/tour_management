const express = require("express");
const router = express.Router();
const couponController = require("../../app/API/CouponApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.post("/applyCoupon", couponController.applyCoupon);

router.use(protectAdminRoutes);

router.get("/", couponController.findAll);
router.get("/:id", couponController.findOne);
router.post("/add", couponController.create);
router.patch("/:id", couponController.update);
router.delete("/:id", couponController.deleteOne);

module.exports = router;
