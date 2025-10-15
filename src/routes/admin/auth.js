const express = require("express");
const router = express.Router();

const authController = require("../../app/controllers/admin/AuthController");

router.get("/admin", authController.login);
router.get("/register", authController.register);

module.exports = router;
