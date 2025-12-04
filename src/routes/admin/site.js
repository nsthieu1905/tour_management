const express = require("express");
const router = express.Router();
const siteController = require("../../app/controllers/admin/SiteController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

// Áp dụng middleware bảo vệ cho tất cả route admin
router.use(protectAdminRoutes);

router.get("/dashboard", siteController.dashboard);

router.get("/qly-tour/trash", siteController.trashTour);

router.get("/qly-tour/:id", siteController.tourDetail);

router.get("/qly-tour", siteController.qlyTour);

router.get("/booking-tour", siteController.bookingTour);

router.get("/qly-nhan-vien", siteController.qlyNhanVien);

router.get("/qly-khach-hang", siteController.qlyKhachHang);

router.get("/doi-tac", siteController.doiTac);

router.get("/thong-ke", siteController.thongKe);

router.get("/settings", siteController.settings);

router.get("/ma-giam-gia", siteController.maGiamGia);

module.exports = router;
