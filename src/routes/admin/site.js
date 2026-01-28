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

router.get(
  "/qly-nhan-vien",
  (req, res, next) => {
    if (req.user?.role !== "admin") {
      return res.status(403).render("auth/forbidden", {
        message: "Bạn không đủ quyền truy cập.",
        layout: false,
      });
    }
    return next();
  },
  siteController.qlyNhanVien,
);

router.get("/qly-khach-hang", siteController.qlyKhachHang);

router.get("/qly-khach-hang/:id", siteController.customerDetail);

router.get("/doi-tac", siteController.doiTac);

router.get("/thong-ke", siteController.thongKe);

router.get("/settings", siteController.settings);

router.get("/ma-giam-gia", siteController.maGiamGia);

router.get("/qly-nhan-tin", siteController.qlyNhanTin);

module.exports = router;
