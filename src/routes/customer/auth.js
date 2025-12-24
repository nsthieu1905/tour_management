const express = require("express");
const router = express.Router();
const authController = require("../../app/controllers/AuthController");

router.get("/login", authController.cusLogin);
router.get("/register", authController.cusRegister);

module.exports = router;
