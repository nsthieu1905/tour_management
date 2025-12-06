const express = require("express");
const router = express.Router();
const favoriteController = require("../../app/API/FavoriteController");
const protectClientRoutes = require("../../middleware/protectClientRoutes");

router.use(protectClientRoutes);

router.post("/toggle", favoriteController.toggleFavorite);
router.get("/list", favoriteController.getUserFavorites);
router.get("/check/:tourId", favoriteController.checkIsFavorited);

module.exports = router;
