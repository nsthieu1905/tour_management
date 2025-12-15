const express = require("express");
const router = express.Router();
const adminStaffController = require("../../app/API/StaffApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");

router.use(protectAdminRoutes);

router.get("/profile", adminStaffController.getProfile);
router.get("/", adminStaffController.findAll);
router.post("/add-staff", adminStaffController.create);
router.put("/update-profile", adminStaffController.updateProfile);
router.put("/change-password", adminStaffController.changePassword);
router.patch("/:id/status", adminStaffController.updateStatus);
router.patch("/:id", adminStaffController.update);
router.delete("/:id", adminStaffController.deleteOne);

module.exports = router;
