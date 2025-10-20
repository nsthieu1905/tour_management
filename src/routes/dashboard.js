const express = require("express");
const router = express.Router();
const upload = require("../config/multer");
const dashboardController = require("../app/controllers/DashboardController");

router.get("/dashboard", dashboardController.dashboard);

// Quản lý tour
router.get("/qly-tour", dashboardController.qlyTour);
router.post(
  "/qly-tour/add",
  upload.array("images"),
  dashboardController.storeTour
);
router.get("/qly-tour/trash", dashboardController.trashTour);
router.delete("/qly-tour/:id", dashboardController.deleteTour);

router.get("/booking-tour", dashboardController.bookingTour);

router.get("/qly-nhan-vien", dashboardController.qlyNhanVien);

router.get("/qly-khach-hang", dashboardController.qlyKhachHang);

router.get("/doi-tac", dashboardController.doiTac);

router.get("/thong-ke", dashboardController.thongKe);

router.get("/settings", dashboardController.settings);

module.exports = router;
