const express = require("express");
const router = express.Router();
const usersApiController = require("../../app/API/UsersApiController");
const protectClientRoutes = require("../../middleware/protectAdminRoutes");

router.get(
  "/current-user",
  protectClientRoutes,
  usersApiController.getCurrentUser
);

module.exports = router;
