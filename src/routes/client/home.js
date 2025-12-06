const express = require("express");
const router = express.Router();

const homeController = require("../../app/controllers/client/HomeController");
const tourApiController = require("../../app/API/ToursApiController");

const protectClientRoutes = require("../../middleware/protectClientRoutes");

router.get("/", homeController.home);
router.use(protectClientRoutes);
router.get("/tours/:id", tourApiController.tourDetail);
router.get("/favorites", homeController.favorites);

module.exports = router;
