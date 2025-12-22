const express = require("express");
const router = express.Router();
const favoriteController = require("../../app/API/FavoriteApiController");
const protectClientRoutes = require("../../middleware/protectClientRoutes");

router.get("/check/:tourId", favoriteController.checkIsFavorited);

router.post("/toggle", protectClientRoutes, favoriteController.toggleFavorite);
router.get("/list", protectClientRoutes, favoriteController.getUserFavorites);

module.exports = router;
