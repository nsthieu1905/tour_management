const express = require("express");
const router = express.Router();
const authController = require("../../../app/controllers/AuthController");
const authApiController = require("../../../app/API/AuthApiController");

router.get("/admin", authController.login);
router.post("/login", authApiController.login);
router.get("/register", authController.register);

module.exports = router;
