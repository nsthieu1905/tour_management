const express = require("express");
const router = express.Router();
const adminStaffController = require("../../app/API/AdminStaffController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

// Middleware: Bảo vệ tất cả routes admin staff
router.use(protectAdminRoutes);

// GET - Lấy danh sách nhân viên
router.get("/", adminStaffController.getStaffList);

// GET - Lấy chi tiết nhân viên
router.get("/:id", adminStaffController.getStaffDetail);

// PUT - Cập nhật thông tin nhân viên
router.put("/:id", adminStaffController.updateStaff);

// DELETE - Xóa nhân viên
router.delete("/:id", adminStaffController.deleteStaff);

module.exports = router;
