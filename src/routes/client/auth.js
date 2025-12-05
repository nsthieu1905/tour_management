const express = require("express");
const router = express.Router();
const authController = require("../../app/controllers/AuthController");

router.get("/login", authController.clientLogin);
router.get("/register", authController.clientRegister);

module.exports = router;
