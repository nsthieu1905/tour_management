const express = require("express");
const router = express.Router();
const adminStaffController = require("../../app/API/StaffApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.use(protectAdminRoutes);

const requireAdminForStaffManagement = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Bạn không đủ quyền truy cập.",
    });
  }
  return next();
};

router.get("/profile", adminStaffController.getProfile);

router.put("/update-profile", adminStaffController.updateProfile);
router.put("/change-password", adminStaffController.changePassword);

router.get("/", requireAdminForStaffManagement, adminStaffController.findAll);
router.post(
  "/add-staff",
  requireAdminForStaffManagement,
  adminStaffController.create,
);
router.patch(
  "/:id/status",
  requireAdminForStaffManagement,
  adminStaffController.updateStatus,
);
router.patch(
  "/:id",
  requireAdminForStaffManagement,
  adminStaffController.update,
);
router.delete(
  "/:id",
  requireAdminForStaffManagement,
  adminStaffController.deleteOne,
);

module.exports = router;
