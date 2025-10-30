const express = require("express");
const router = express.Router();
const dashboardController = require("../../app/controllers/admin/DashboardController");

router.get("/dashboard", dashboardController.dashboard);

router.get("/qly-tour", dashboardController.qlyTour);

router.get("/qly-tour/trash", dashboardController.trashTour);

router.get("/booking-tour", dashboardController.bookingTour);

router.get("/qly-nhan-vien", dashboardController.qlyNhanVien);

router.get("/qly-khach-hang", dashboardController.qlyKhachHang);

router.get("/doi-tac", dashboardController.doiTac);

router.get("/thong-ke", dashboardController.thongKe);

router.get("/settings", dashboardController.settings);

module.exports = router;
