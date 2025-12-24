const express = require("express");
const router = express.Router();
const usersApiController = require("../../app/API/UsersApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");
const protectCusRoutes = require("../../middleware/protectCustomerRoutes");

router.get(
  "/current-user",
  protectCusRoutes.optional,
  usersApiController.getCurrentUser
);

router.get("/profile", protectCusRoutes, usersApiController.getProfile);
router.put(
  "/update-profile",
  protectCusRoutes,
  usersApiController.updateProfile
);
router.put(
  "/change-password",
  protectCusRoutes,
  usersApiController.changePassword
);

router.use(protectAdminRoutes);

router.get("/qly-khach-hang", usersApiController.findAll);
router.get("/qly-khach-hang/:id/detail", usersApiController.findOne);
router.get("/qly-khach-hang/stats", usersApiController.getCustomerStats);

module.exports = router;
