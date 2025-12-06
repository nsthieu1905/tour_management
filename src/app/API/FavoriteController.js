const { Favorite, Tour } = require("../models/index");

// [POST] /api/favorites/toggle
const toggleFavorite = async (req, res) => {
  try {
    const { tourId } = req.body;
    const userId = req.user.userId; // From protectClientRoutes middleware

    // kiểm tra tour đã thích hay chưa
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
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/favorites
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Lấy danh sách yêu thích của user trùng với userId
    const favorites = await Favorite.find({
      userId,
      isFavorited: true,
    })
      .populate("tourId")
      .lean();

    // Lấy chỉ danh sách tour từ favorites
    const favoriteTours = favorites.map((fav) => fav.tourId).filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        favorites: favoriteTours,
        count: favoriteTours.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

// [GET] /api/favorites/check/:tourId
const checkIsFavorited = async (req, res) => {
  try {
    const { tourId } = req.params;
    const userId = req.user.userId;

    const exists = await Favorite.exists({
      userId,
      tourId,
      isFavorited: true,
    });

    return res.status(200).json({
      success: true,
      isFavorited: !!exists,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server, vui lòng thử lại sau",
    });
  }
};

module.exports = {
  toggleFavorite,
  getUserFavorites,
  checkIsFavorited,
};
