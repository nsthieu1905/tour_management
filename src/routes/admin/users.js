const express = require("express");
const router = express.Router();
const usersApiController = require("../../app/API/UsersApiController");
const staffApiController = require("../../app/API/StaffApiController");
const protectClientRoutes = require("../../middleware/protectClientRoutes");

router.get(
  "/current-user",
  protectClientRoutes,
  usersApiController.getCurrentUser
);

// Customer APIs
router.get("/customers", staffApiController.getCustomersWithStats);
router.get("/customers/stats", staffApiController.getCustomerStats);
router.get("/customers/:id/detail", staffApiController.getCustomerDetail);

module.exports = router;
