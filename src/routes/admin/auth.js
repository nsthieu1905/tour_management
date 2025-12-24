const express = require("express");
const router = express.Router();
const authController = require("../../app/controllers/AuthController");
const authApiController = require("../../app/API/AuthApiController");
const protectAdminRoutes = require("../../middleware/protectAdminRoutes");
const protectCusRoutes = require("../../middleware/protectCustomerRoutes");

router.get("/admin", authController.login);
router.post("/login", authApiController.adminLogin);
router.post("/cus-login", authApiController.cusLogin);
router.post("/register", authApiController.register);
router.post("/add-staff", protectAdminRoutes, authApiController.addAdmin);
router.post("/check-token", authApiController.checkToken);
router.post("/refresh", authApiController.refreshToken);
router.post("/logout", authApiController.logout);

module.exports = router;
