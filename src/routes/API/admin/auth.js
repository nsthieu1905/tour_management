const express = require("express");
const router = express.Router();
const authController = require("../../../app/controllers/AuthController");
const authApiController = require("../../../app/API/AuthApiController");

router.get("/admin", authController.login);
router.get("/refresh-required", authController.login); // Redirect về login khi token hết hạn
router.post("/login", authApiController.login);
router.post("/check-token", authApiController.checkToken);
router.post("/refresh", authApiController.refreshToken);
router.post("/logout", authApiController.logout);
router.get("/register", authController.register);

module.exports = router;
