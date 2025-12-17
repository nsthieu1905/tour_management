const { Tour, Favorite, TourCategory } = require("../../models/index");

// [GET] /
const home = async (req, res) => {
  try {
    const categories = await TourCategory.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const categoriesWithTours = (
      await Promise.all(
        (categories || []).map(async (c) => {
          const tours = await Tour.find({
            status: "active",
            categoryId: c._id,
          })
            .sort({ createdAt: -1 })
            .limit(6)
            .lean();

          return {
            ...c,
            tours,
          };
        })
      )
    ).filter((c) => Array.isArray(c.tours) && c.tours.length > 0);

    const tours = await Tour.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    return res.render("home", {
      bodyClass: "bg-gray-50",
      tours,
      categoriesWithTours,
      user: req.user,
    });
  } catch (error) {
    console.error("Home page error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /tours
const toursList = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "").trim();
    const sort = String(req.query.sort || "newest").trim();
    const category = String(req.query.category || "").trim();
    const destination = String(req.query.destination || "").trim();

    const escapeRegex = (value) =>
      String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filter = { status: "active" };
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ name: rx }, { destination: rx }, { tourCode: rx }];
    }
    if (type) {
      filter.tourType = type;
    }

    if (destination) {
      filter.destination = new RegExp(`^${escapeRegex(destination)}$`, "i");
    }

    let selectedCategory = null;
    if (category) {
      selectedCategory = await TourCategory.findOne({ slug: category }).lean();
      if (!selectedCategory && /^[a-f\d]{24}$/i.test(category)) {
        selectedCategory = await TourCategory.findById(category).lean();
      }
      if (selectedCategory) {
        filter.categoryId = selectedCategory._id;
      }
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    const buildToursUrl = (overrides = {}) => {
      const params = {
        q,
        type,
        sort,
        category,
        destination,
        ...overrides,
      };

      Object.keys(params).forEach((key) => {
        const v = params[key];
        if (v === undefined || v === null || String(v).trim() === "") {
          delete params[key];
        }
      });

      const qs = new URLSearchParams(params).toString();
      return `/tours${qs ? `?${qs}` : ""}`;
    };

    const sidebarFilter = { ...filter };
    delete sidebarFilter.destination;
    const destinationMatch = {
      ...sidebarFilter,
      destination: { $nin: [null, ""] },
    };

    const [tours, categories, destinationsAgg] = await Promise.all([
      Tour.find(filter).sort(sortOption).lean(),
      TourCategory.find({}).sort({ order: 1, createdAt: -1 }).lean(),
      Tour.aggregate([
        { $match: destinationMatch },
        { $group: { _id: "$destination", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    const destinations = (destinationsAgg || [])
      .filter((x) => x && x._id)
      .map((x) => ({
        name: x._id,
        count: x.count,
        url: buildToursUrl({ destination: x._id }),
      }));

    const categoriesForView = (categories || []).map((c) => ({
      ...c,
      url: buildToursUrl({ category: c.slug || c._id }),
    }));

    const clearCategoryUrl = buildToursUrl({ category: null });
    const clearDestinationUrl = buildToursUrl({ destination: null });

    return res.render("tours", {
      bodyClass: "bg-gray-50",
      tours,
      total: tours.length,
      query: { q, type, sort, category, destination },
      categories: categoriesForView,
      destinations,
      selectedCategory,
      clearCategoryUrl,
      clearDestinationUrl,
      user: req.user,
    });
  } catch (error) {
    console.error("Tours list page error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

// [GET] /profile
const profile = async (req, res) => {
  try {
    return res.render("profile", {
      bodyClass: "bg-gray-50",
      user: req.user,
    });
  } catch (error) {
    console.error("Profile page error:", error);
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
      user: req.user,
    });
  } catch (error) {
    console.error("Favorites page error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ, vui lòng thử lại sau.",
    });
  }
};

module.exports = {
  home,
  toursList,
  favorites,
  profile,
};
