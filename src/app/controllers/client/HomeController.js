const { Tour } = require("../../models/index");

// [GET] /
const home = (req, res) => {
  res.render("home", {
    bodyClass: "bg-gray-50",
  });
};

// [GET] /tour/:id - Client tour detail page
const tourDetail = async (req, res, next) => {
  try {
    const tour = await Tour.findById(req.params.id).lean();

    if (!tour) {
      return res.status(404).render("error", {
        message: "Tour không tồn tại",
        bodyClass: "bg-gray-50",
      });
    }

    // Parse stringified arrays nếu cần
    if (typeof tour.highlights === "string") {
      tour.highlights = tour.highlights.split("\n").filter((h) => h.trim());
    }

    if (typeof tour.includes === "string") {
      tour.includes = tour.includes.split("\n").filter((i) => i.trim());
    }

    if (typeof tour.excludes === "string") {
      tour.excludes = tour.excludes.split("\n").filter((e) => e.trim());
    }

    if (typeof tour.cancellationPolicy === "string") {
      tour.cancellationPolicy = tour.cancellationPolicy
        .split("\n")
        .filter((p) => p.trim());
    }

    res.render("tour-detail", {
      tour,
      // layout: false,
      bodyClass: "bg-gray-50",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  home,
  tourDetail,
};
