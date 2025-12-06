const { Favorite, Tour } = require("../models/index");

// [POST] /api/favorites/toggle - Add or remove favorite
const toggleFavorite = async (req, res) => {
  try {
    const { tourId } = req.body;
    const userId = req.user.userId; // From authenticateFromCookie middleware

    // Check if favorite already exists
    const existingFavorite = await Favorite.findOne({
      userId,
      tourId,
    });

    if (existingFavorite) {
      // Remove favorite
      await Favorite.deleteOne({ userId, tourId });
      return res.status(200).json({
        success: true,
        message: "Đã bỏ thích tour",
        isFavorited: false,
      });
    } else {
      // Add favorite
      await Favorite.create({
        userId,
        tourId,
        isFavorited: true,
      });
      return res.status(201).json({
        success: true,
        message: "Đã thêm tour vào danh sách yêu thích",
        isFavorited: true,
      });
    }
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật danh sách yêu thích",
      error: error.message,
    });
  }
};

// [GET] /api/favorites - Get user's favorite tours
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Find all favorites for user
    const favorites = await Favorite.find({
      userId,
      isFavorited: true,
    }).populate("tourId");

    // Extract tour data
    const favoriteTours = favorites.map((fav) => fav.tourId).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        favorites: favoriteTours,
        count: favoriteTours.length,
      },
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách yêu thích",
      error: error.message,
    });
  }
};

// [GET] /api/favorites/check/:tourId - Check if tour is favorited
const checkIsFavorited = async (req, res) => {
  try {
    const { tourId } = req.params;
    const userId = req.user.userId;

    const favorite = await Favorite.findOne({
      userId,
      tourId,
      isFavorited: true,
    });

    return res.status(200).json({
      success: true,
      isFavorited: !!favorite,
    });
  } catch (error) {
    console.error("Check favorite error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi kiểm tra trạng thái yêu thích",
      error: error.message,
    });
  }
};

module.exports = {
  toggleFavorite,
  getUserFavorites,
  checkIsFavorited,
};
