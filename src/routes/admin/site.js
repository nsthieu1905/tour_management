const express = require("express");
const router = express.Router();
const siteController = require("../../app/controllers/admin/SiteController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.use(protectAdminRoutes);

router.get("/dashboard", siteController.dashboard);

router.get("/qly-tour/trash", siteController.trashTour);

router.get("/qly-tour", siteController.qlyTour);

router.get("/qly-tour/categories", siteController.qlyTourCategories);

router.get("/booking-tour", siteController.bookingTour);

router.get("/qly-nhan-vien", siteController.qlyNhanVien);

router.get("/qly-khach-hang", siteController.qlyKhachHang);

router.get("/qly-khach-hang/:id", siteController.customerDetail);

router.get("/doi-tac", siteController.doiTac);

router.get("/thong-ke", siteController.thongKe);

router.get("/settings", siteController.settings);

router.get("/ma-giam-gia", siteController.maGiamGia);

router.get("/qly-nhan-tin", siteController.qlyNhanTin);

module.exports = router;
