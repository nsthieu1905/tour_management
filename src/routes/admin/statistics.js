const express = require("express");
const router = express.Router();
const statisticsApiController = require("../../app/API/StatisticsApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.use(protectAdminRoutes);

router.get("/dashboard", statisticsApiController.getDashboardStatistics);
router.get("/thong-ke", statisticsApiController.getThongKeStatistics);

module.exports = router;
