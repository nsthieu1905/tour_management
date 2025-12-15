const express = require("express");
const router = express.Router();
const statisticsApiController = require("../../app/API/StatisticsApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

// Áp dụng bảo vệ cho tất cả routes thống kê
router.use(protectAdminRoutes);

router.get("/dashboard", statisticsApiController.getDashboardStats);
router.get("/revenue", statisticsApiController.getRevenueStats);
router.get("/popular-tours", statisticsApiController.getPopularTours);
router.get("/booking-trends", statisticsApiController.getBookingTrends);
router.get(
  "/tour-type-distribution",
  statisticsApiController.getTourTypeDistribution
);
router.get(
  "/booking-status-distribution",
  statisticsApiController.getBookingStatusDistribution
);

module.exports = router;
