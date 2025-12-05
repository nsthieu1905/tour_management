const express = require("express");
const router = express.Router();
const authController = require("../../../app/controllers/AuthController");
const authApiController = require("../../../app/API/AuthApiController");
const {
  authenticateFromCookie,
} = require("../../../middleware/authMiddleware");

router.get("/admin", authController.login);
router.get("/refresh-required", authController.login);
router.post("/login", authApiController.login);
router.post("/client-login", authApiController.clientLogin);
router.post("/register", authApiController.register);
router.post("/check-token", authApiController.checkToken);
router.post("/refresh", authApiController.refreshToken);
router.post("/logout", authApiController.logout);
router.get(
  "/current-user",
  authenticateFromCookie,
  authApiController.getCurrentUser
);
router.get("/register", authController.register);

module.exports = router;
