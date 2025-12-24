const express = require("express");
const router = express.Router();
const favoriteController = require("../../app/API/FavoriteApiController");
const protectCusRoutes = require("../../middleware/protectCustomerRoutes");

router.get("/check/:tourId", favoriteController.checkIsFavorited);

router.post("/toggle", protectCusRoutes, favoriteController.toggleFavorite);
router.get("/list", protectCusRoutes, favoriteController.getUserFavorites);

module.exports = router;
