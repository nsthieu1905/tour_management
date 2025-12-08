const { Tour, Favorite } = require("../../models/index");

// [GET] /
const home = async (req, res) => {
  try {
    const tours = await Tour.find({}).lean();

    return res.render("home", {
      bodyClass: "bg-gray-50",
      tours: tours,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /favorites
const favorites = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Lấy danh sách yêu thích của người dùng
    const favorites = await Favorite.find({
      userId: userId,
    }).lean();

    // Lấy thông tin chi tiết của các tour yêu thích của user trùng với userId
    const favoriteTours = [];
    for (const fav of favorites) {
      const tour = await Tour.findById(fav.tourId).lean();
      if (tour) {
        favoriteTours.push(tour);
      }
    }

    return res.render("favorites", {
      bodyClass: "bg-gray-50",
      favorites: favoriteTours,
      count: favoriteTours.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

module.exports = {
  home,
  favorites,
};
