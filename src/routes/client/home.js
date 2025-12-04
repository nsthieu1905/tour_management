const express = require("express");
const router = express.Router();

const homeController = require("../../app/controllers/client/HomeController");
const tourApiController = require("../../app/API/ToursApiController");

router.get("/", homeController.home);
router.get("/tour/:id", tourApiController.tourDetail);

module.exports = router;
