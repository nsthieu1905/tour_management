const { Tour, Favorite } = require("../../models/index");

// [GET] /
const home = (req, res) => {
  res.render("home", {
    bodyClass: "bg-gray-50",
  });
};

// [GET] /favorites - View user's favorite tours
const favorites = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's favorites
    const favorites = await Favorite.find({
      userId: userId,
    }).lean();

    // Manually fetch tour data for each favorite
    const favoriteTours = [];
    for (const fav of favorites) {
      const tour = await Tour.findById(fav.tourId).lean();
      if (tour) {
        favoriteTours.push(tour);
      }
    }

    res.render("favorites", {
      bodyClass: "bg-gray-50",
      favorites: favoriteTours,
      count: favoriteTours.length,
    });
  } catch (error) {
    console.error("Favorites view error:", error);
    res.status(500).render("errors/error", {
      message: "Lỗi khi tải danh sách yêu thích",
    });
  }
};

module.exports = {
  home,
  favorites,
};
