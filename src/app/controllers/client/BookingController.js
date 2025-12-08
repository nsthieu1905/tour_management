const { Tour } = require("../../models/index");

// GET /booking/:slug
const bookingPage = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const tour = await Tour.findOne({ slug }).lean();

    res.render("tour-booking", {
      tour: tour,
      user: req.user,
    });
  } catch (error) {
    console.error("Booking page error:", error);
  }
};

module.exports = { bookingPage };
