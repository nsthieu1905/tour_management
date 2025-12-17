const express = require("express");
const router = express.Router();
const usersApiController = require("../../app/API/UsersApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");
const protectClientRoutes = require("../../middleware/protectClientRoutes");

router.get(
  "/current-user",
  protectClientRoutes,
  usersApiController.getCurrentUser
);

router.get("/profile", protectClientRoutes, usersApiController.getProfile);
router.put(
  "/update-profile",
  protectClientRoutes,
  usersApiController.updateProfile
);
router.put(
  "/change-password",
  protectClientRoutes,
  usersApiController.changePassword
);

router.use(protectAdminRoutes);

router.get("/qly-khach-hang", usersApiController.findAll);
router.get("/qly-khach-hang/:id/detail", usersApiController.findOne);
router.get("/qly-khach-hang/stats", usersApiController.getCustomerStats);

module.exports = router;
