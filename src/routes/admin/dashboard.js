const express = require("express");
const router = express.Router();
const dashboardController = require("../../app/controllers/admin/DashboardController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

// Áp dụng middleware bảo vệ cho tất cả route admin
router.use(protectAdminRoutes);

router.get("/dashboard", dashboardController.dashboard);

router.get("/qly-tour/trash", dashboardController.trashTour);

router.get("/qly-tour/:id", dashboardController.tourDetail);

router.get("/qly-tour", dashboardController.qlyTour);

router.get("/booking-tour", dashboardController.bookingTour);

router.get("/qly-nhan-vien", dashboardController.qlyNhanVien);

router.get("/qly-khach-hang", dashboardController.qlyKhachHang);

router.get("/doi-tac", dashboardController.doiTac);

router.get("/thong-ke", dashboardController.thongKe);

router.get("/settings", dashboardController.settings);

module.exports = router;
